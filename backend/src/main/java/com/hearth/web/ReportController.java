package com.hearth.web;

import com.hearth.service.ReportService;
import com.hearth.web.dto.ReportDtos.TodayReport;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/today")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public TodayReport today() {
        return reportService.today();
    }
}
