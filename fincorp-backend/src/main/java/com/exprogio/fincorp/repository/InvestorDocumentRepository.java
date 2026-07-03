package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.InvestorDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestorDocumentRepository extends JpaRepository<InvestorDocument, String> {
}
