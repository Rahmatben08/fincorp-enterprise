package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    List<User> findByStatus(String status);
}
