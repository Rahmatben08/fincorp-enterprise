package com.exprogio.fincorp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.Table;

@Entity
@Table(name = "investor_documents")
public class InvestorDocument {
    @Id
    private String documentId;
    private String title;
    private String type; 
    @Column(name = "doc_year")
    private String year;
    private String publishDate;
    private String url;

    public InvestorDocument() {}

    public InvestorDocument(String documentId, String title, String type, String year, String publishDate, String url) {
        this.documentId = documentId;
        this.title = title;
        this.type = type;
        this.year = year;
        this.publishDate = publishDate;
        this.url = url;
    }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public String getPublishDate() { return publishDate; }
    public void setPublishDate(String publishDate) { this.publishDate = publishDate; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String documentId;
        private String title;
        private String type;
        private String year;
        private String publishDate;
        private String url;

        public Builder documentId(String documentId) { this.documentId = documentId; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder type(String type) { this.type = type; return this; }
        public Builder year(String year) { this.year = year; return this; }
        public Builder publishDate(String publishDate) { this.publishDate = publishDate; return this; }
        public Builder url(String url) { this.url = url; return this; }

        public InvestorDocument build() {
            return new InvestorDocument(documentId, title, type, year, publishDate, url);
        }
    }
}
