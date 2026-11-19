package com.hearth.repo;

import com.hearth.domain.MenuItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    @EntityGraph(attributePaths = "category")
    List<MenuItem> findAllByOrderByCategory_NameAscNameAsc();

    @Query("select i from MenuItem i where i.id = :id")
    @EntityGraph(attributePaths = "category")
    Optional<MenuItem> findWithCategoryById(@Param("id") Long id);

    long countByCategory_Id(Long categoryId);
}
