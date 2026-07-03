package com.exprogio.fincorp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "esg_metrics")
public class ESGMetric {
    @Id
    private String metricId;
    private String category;
    private String name; 
    @Column(name = "metric_value")
    private String value;
    private String unit; 
    private String trend; 

    public ESGMetric() {}

    public ESGMetric(String metricId, String category, String name, String value, String unit, String trend) {
        this.metricId = metricId;
        this.category = category;
        this.name = name;
        this.value = value;
        this.unit = unit;
        this.trend = trend;
    }

    public String getMetricId() { return metricId; }
    public void setMetricId(String metricId) { this.metricId = metricId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String metricId;
        private String category;
        private String name;
        private String value;
        private String unit;
        private String trend;

        public Builder metricId(String metricId) { this.metricId = metricId; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder value(String value) { this.value = value; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder trend(String trend) { this.trend = trend; return this; }

        public ESGMetric build() {
            return new ESGMetric(metricId, category, name, value, unit, trend);
        }
    }
}
