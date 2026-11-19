package com.hearth.repo;

import com.hearth.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    boolean existsByMenuItem_Id(Long menuItemId);

    @Query("""
            select i.menuItem.name, sum(i.quantity) from OrderItem i
            where i.order.orderedAt >= :start and i.order.orderedAt < :end
              and i.order.status <> com.hearth.domain.OrderStatus.CANCELLED
            group by i.menuItem.name
            order by sum(i.quantity) desc
            """)
    List<Object[]> popularItems(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
