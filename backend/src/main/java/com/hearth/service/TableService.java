package com.hearth.service;

import com.hearth.domain.OrderStatus;
import com.hearth.domain.RestaurantTable;
import com.hearth.domain.TableStatus;
import com.hearth.error.ApiException;
import com.hearth.repo.OrderRepository;
import com.hearth.repo.TableRepository;
import com.hearth.web.dto.TableDtos.TableRequest;
import com.hearth.web.dto.TableDtos.TableResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class TableService {

    private static final List<OrderStatus> CLOSED = List.of(OrderStatus.SERVED, OrderStatus.CANCELLED);

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;

    public TableService(TableRepository tableRepository, OrderRepository orderRepository) {
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<TableResponse> getTables() {
        return tableRepository.findAll().stream()
                .sorted(Comparator
                        .comparingInt((RestaurantTable table) -> numberRank(table.getTableNumber()))
                        .thenComparing(RestaurantTable::getTableNumber))
                .map(TableResponse::from)
                .toList();
    }

    @Transactional
    public TableResponse createTable(TableRequest request) {
        String number = request.tableNumber().trim();
        if (tableRepository.existsByTableNumber(number)) {
            throw new ApiException(409, "That table number is already in use.");
        }
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(number);
        table.setCapacity(request.capacity());
        table.setStatus(request.status() == null ? TableStatus.AVAILABLE : request.status());
        return TableResponse.from(tableRepository.save(table));
    }

    @Transactional
    public TableResponse updateTable(Long id, TableRequest request) {
        RestaurantTable table = load(id);
        String number = request.tableNumber().trim();
        if (tableRepository.existsByTableNumberAndIdNot(number, id)) {
            throw new ApiException(409, "That table number is already in use.");
        }
        table.setTableNumber(number);
        table.setCapacity(request.capacity());
        if (request.status() != null) {
            applyStatus(table, request.status());
        }
        return TableResponse.from(table);
    }

    @Transactional
    public TableResponse updateStatus(Long id, TableStatus status) {
        RestaurantTable table = load(id);
        applyStatus(table, status);
        return TableResponse.from(table);
    }

    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = load(id);
        if (orderRepository.existsByTable_Id(id)) {
            throw new ApiException(409, "This table has orders. Keep it and change the status instead.");
        }
        tableRepository.delete(table);
    }

    private void applyStatus(RestaurantTable table, TableStatus status) {
        boolean open = orderRepository.existsByTable_IdAndStatusNotIn(table.getId(), CLOSED);
        if (open && (status == TableStatus.AVAILABLE || status == TableStatus.RESERVED)) {
            throw new ApiException(409, "This table still has an open order.");
        }
        table.setStatus(status);
    }

    private RestaurantTable load(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That table does not exist."));
    }

    private int numberRank(String tableNumber) {
        try {
            return Integer.parseInt(tableNumber);
        } catch (NumberFormatException ex) {
            return Integer.MAX_VALUE;
        }
    }
}
