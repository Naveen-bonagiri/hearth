package com.hearth.web.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record StatusCount(String status, long count) {
    }

    public record PopularItem(String name, long quantity) {
    }

    public record TodayReport(
            long todayOrders,
            BigDecimal todayRevenue,
            List<StatusCount> ordersByStatus,
            List<PopularItem> popularItems
    ) {
    }
}
