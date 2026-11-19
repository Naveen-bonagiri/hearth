package com.hearth.web;

import com.hearth.service.OrderService;
import com.hearth.web.dto.OrderDtos.CreateOrderRequest;
import com.hearth.web.dto.OrderDtos.OrderResponse;
import com.hearth.web.dto.OrderDtos.StatusRequest;
import com.hearth.web.dto.OrderDtos.UpdateOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ORDER_CREATE')")
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ORDER_VIEW')")
    public List<OrderResponse> getOrders() {
        return orderService.getOrders();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ORDER_VIEW')")
    public OrderResponse getOrder(@PathVariable Long id) {
        return orderService.getOrder(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ORDER_UPDATE')")
    public OrderResponse updateOrder(@PathVariable Long id, @Valid @RequestBody UpdateOrderRequest request) {
        return orderService.updateOrder(id, request);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ORDER_CANCEL')")
    public OrderResponse cancelOrder(@PathVariable Long id) {
        return orderService.cancelOrder(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ORDER_UPDATE')")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return orderService.updateStatus(id, request.status());
    }
}
