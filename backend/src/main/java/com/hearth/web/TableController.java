package com.hearth.web;

import com.hearth.service.TableService;
import com.hearth.web.dto.TableDtos.StatusRequest;
import com.hearth.web.dto.TableDtos.TableRequest;
import com.hearth.web.dto.TableDtos.TableResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('TABLE_VIEW','ORDER_CREATE')")
    public List<TableResponse> getTables() {
        return tableService.getTables();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('TABLE_MANAGE')")
    public TableResponse createTable(@Valid @RequestBody TableRequest request) {
        return tableService.createTable(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TABLE_MANAGE')")
    public TableResponse updateTable(@PathVariable Long id, @Valid @RequestBody TableRequest request) {
        return tableService.updateTable(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('TABLE_VIEW')")
    public TableResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return tableService.updateStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('TABLE_MANAGE')")
    public void deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
    }
}
