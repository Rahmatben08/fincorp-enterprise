# Build stage
FROM golang:1.20-alpine AS build
WORKDIR /app
COPY go.mod ./
# Download dependencies
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o fincorp-payroll-service

# Production stage
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/fincorp-payroll-service .
EXPOSE 8082
CMD ["./fincorp-payroll-service"]
