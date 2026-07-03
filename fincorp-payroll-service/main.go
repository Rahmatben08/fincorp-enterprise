package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

// Employee maps database record
type Employee struct {
	Email       string  `json:"email"`
	FullName    string  `json:"full_name"`
	Division    string  `json:"division"`
	BaseSalary  float64 `json:"base_salary"`
	Allowance   float64 `json:"allowance"`
	KpiTarget   int     `json:"kpi_target"`
	KpiAchieved int     `json:"kpi_achieved"`
}

// PayrollJob input structure
type PayrollRequest struct {
	Period string `json:"period"`
}

// PayrollResponse output details
type PayrollResponse struct {
	Status       string `json:"status"`
	ProcessedCount int    `json:"processed_count"`
	ElapsedMs    int64  `json:"elapsed_ms"`
}

var db *sql.DB

func main() {
	// 1. Establish Database Connection (PostgreSQL)
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "fincorp_admin"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "SecretPassword123"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "fincorp_enterprise_db"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Gagal membuka koneksi database: %v", err)
	}
	defer db.Close()

	// Wait for db to be online
	for i := 0; i < 5; i++ {
		err = db.Ping()
		if err == nil {
			break
		}
		log.Println("Menunggu database online...")
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Gagal terhubung ke PostgreSQL: %v", err)
	}
	log.Println("Berhasil terhubung ke database PostgreSQL")

	// 2. Setup HTTP Server Router
	http.HandleFunc("/payroll/batch", handleBatchPayroll)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Printf("Go Payroll Batch Service berjalan pada port %s...\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Gagal menjalankan server HTTP: %v", err)
	}
}

// handleBatchPayroll processes all employees' salary slips concurrently in a worker pool
func handleBatchPayroll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Metode HTTP tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	var req PayrollRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.Period == "" {
		http.Error(w, "Input JSON tidak valid. Memerlukan field 'period'.", http.StatusBadRequest)
		return
	}

	startTime := time.Now()

	// 1. Fetch all employees from PostgreSQL
	rows, err := db.Query("SELECT email, full_name, division, base_salary, allowance, kpi_target, kpi_achieved FROM employees")
	if err != nil {
		log.Printf("Gagal membaca data karyawan: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var emp Employee
		if err := rows.Scan(&emp.Email, &emp.FullName, &emp.Division, &emp.BaseSalary, &emp.Allowance, &emp.KpiTarget, &emp.KpiAchieved); err != nil {
			log.Printf("Scan row error: %v\n", err)
			continue
		}
		employees = append(employees, emp)
	}

	totalEmployees := len(employees)
	if totalEmployees == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PayrollResponse{
			Status:         "Success",
			ProcessedCount: 0,
			ElapsedMs:      time.Since(startTime).Milliseconds(),
		})
		return
	}

	// 2. Concurrency Processing (Goroutines + Channels)
	jobs := make(chan Employee, totalEmployees)
	results := make(chan string, totalEmployees)

	// Worker Pool Size
	workerCount := 5
	var wg sync.WaitGroup

	// Start workers
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for emp := range jobs {
				// Process Calculations: Gaji Pokok + Tunjangan + (KPI % * 15% Gaji)
				bonus := emp.BaseSalary * 0.15 * (float64(emp.KpiAchieved) / 100.0)
				tax := (emp.BaseSalary + emp.Allowance) * 0.05
				bpjs := (emp.BaseSalary + emp.Allowance) * 0.02
				netSalary := (emp.BaseSalary + emp.Allowance + bonus) - (tax + bpjs)

				// Generate unique payslip ID
				payslipID := fmt.Sprintf("SL-%d-%d", time.Now().Unix(), int(math.Mod(emp.BaseSalary, 1000)))

				// Insert into DB
				releaseDate := time.Now().Format("2006-01-02")
				_, dbErr := db.Exec(`INSERT INTO payroll (
					payroll_id, employee_email, employee_name, division, period, 
					base_salary, allowance, bonus, tax, bpjs, net_salary, release_date
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				ON CONFLICT (payroll_id) DO NOTHING`,
					payslipID, emp.Email, emp.FullName, emp.Division, req.Period,
					emp.BaseSalary, emp.Allowance, bonus, tax, bpjs, netSalary, releaseDate)

				if dbErr != nil {
					log.Printf("[Worker %d] Gagal memproses payroll %s: %v\n", workerID, emp.Email, dbErr)
					results <- "Failed"
				} else {
					log.Printf("[Worker %d] Berhasil memproses payroll %s\n", workerID, emp.Email)
					results <- "Success"
				}
			}
		}(i)
	}

	// Send jobs
	for _, emp := range employees {
		jobs <- emp
	}
	close(jobs)

	// Wait for workers to finish
	wg.Wait()
	close(results)

	// Count successful runs
	successCount := 0
	for res := range results {
		if res == "Success" {
			successCount++
		}
	}

	elapsed := time.Since(startTime).Milliseconds()

	// Return output JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PayrollResponse{
		Status:         "Success",
		ProcessedCount: successCount,
		ElapsedMs:      elapsed,
	})
}
