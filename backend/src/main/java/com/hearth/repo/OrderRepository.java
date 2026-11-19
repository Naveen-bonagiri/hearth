package com.hearth.repo;

import com.hearth.domain.Order;
import com.hearth.domain.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items", "items.menuItem", "user", "table"})
    List<Order> findAllByOrderByOrderedAtDesc();

    @EntityGraph(attributePaths = {"items", "items.menuItem", "user", "table"})
    List<Order> findByUser_IdOrderByOrderedAtDesc(Long userId);

    @Query("select o from Order o where o.id = :id")
    @EntityGraph(attributePaths = {"items", "items.menuItem", "user", "table"})
    Optional<Order> findWithDetailsById(@Param("id") Long id);

    boolean existsByUser_Id(Long userId);

    boolean existsByTable_Id(Long tableId);

    boolean existsByTable_IdAndStatusNotIn(Long tableId, Collection<OrderStatus> statuses);

    @Query("""
            select count(o) from Order o
            where o.orderedAt >= :start and o.orderedAt < :end
            """)
    long countToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            select coalesce(sum(o.totalAmount), 0) from Order o
            where o.orderedAt >= :start and o.orderedAt < :end
              and o.status <> com.hearth.domain.OrderStatus.CANCELLED
            """)
    BigDecimal revenueToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            select o.status, count(o) from Order o
            where o.orderedAt >= :start and o.orderedAt < :end
            group by o.status
            """)
    List<Object[]> countByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
