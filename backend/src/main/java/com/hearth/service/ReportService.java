package com.hearth.service;

import com.hearth.domain.OrderStatus;
import com.hearth.repo.OrderItemRepository;
import com.hearth.repo.OrderRepository;
import com.hearth.web.dto.ReportDtos.PopularItem;
import com.hearth.web.dto.ReportDtos.StatusCount;
import com.hearth.web.dto.ReportDtos.TodayReport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public ReportService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public TodayReport today() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        long todayOrders = orderRepository.countToday(start, end);
        BigDecimal revenue = orderRepository.revenueToday(start, end);
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }
        Map<OrderStatus, Long> counts = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            counts.put(status, 0L);
        }
        for (Object[] row : orderRepository.countByStatus(start, end)) {
            counts.put((OrderStatus) row[0], (Long) row[1]);
        }
        List<StatusCount> ordersByStatus = new ArrayList<>();
        for (OrderStatus status : OrderStatus.values()) {
            ordersByStatus.add(new StatusCount(status.name(), counts.get(status)));
        }
        List<PopularItem> popular = orderItemRepository.popularItems(start, end).stream()
                .limit(5)
                .map(row -> new PopularItem((String) row[0], ((Number) row[1]).longValue()))
                .toList();
        return new TodayReport(todayOrders, revenue, ordersByStatus, popular);
    }
}
