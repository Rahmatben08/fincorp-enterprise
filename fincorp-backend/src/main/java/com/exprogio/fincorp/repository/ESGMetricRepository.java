package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.ESGMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ESGMetricRepository extends JpaRepository<ESGMetric, String> {
}
