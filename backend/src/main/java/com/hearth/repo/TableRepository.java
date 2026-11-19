package com.hearth.repo;

import com.hearth.domain.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableRepository extends JpaRepository<RestaurantTable, Long> {

    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    boolean existsByTableNumber(String tableNumber);

    boolean existsByTableNumberAndIdNot(String tableNumber, Long id);
}
