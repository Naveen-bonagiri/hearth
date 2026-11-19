package com.hearth.service;

import com.hearth.domain.MenuItem;
import com.hearth.domain.Order;
import com.hearth.domain.OrderItem;
import com.hearth.domain.OrderStatus;
import com.hearth.domain.RestaurantTable;
import com.hearth.domain.TableStatus;
import com.hearth.domain.User;
import com.hearth.error.ApiException;
import com.hearth.repo.MenuItemRepository;
import com.hearth.repo.OrderRepository;
import com.hearth.repo.TableRepository;
import com.hearth.repo.UserRepository;
import com.hearth.security.CurrentUser;
import com.hearth.web.dto.OrderDtos.CreateOrderRequest;
import com.hearth.web.dto.OrderDtos.LineRequest;
import com.hearth.web.dto.OrderDtos.OrderResponse;
import com.hearth.web.dto.OrderDtos.UpdateOrderRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private static final List<OrderStatus> CLOSED = List.of(OrderStatus.SERVED, OrderStatus.CANCELLED);

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableRepository tableRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            TableRepository tableRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.tableRepository = tableRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        User user = currentUser();
        RestaurantTable table = tableRepository.findById(request.tableId())
                .orElseThrow(() -> new ApiException(404, "That table does not exist."));
        Order order = new Order();
        order.setUser(user);
        order.setTable(table);
        order.setStatus(OrderStatus.PENDING);
        order.setOrderedAt(LocalDateTime.now());
        applyLines(order, request.items(), Map.of());
        table.setStatus(TableStatus.OCCUPIED);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders() {
        User user = currentUser();
        List<Order> orders = CurrentUser.isFloor()
                ? orderRepository.findAllByOrderByOrderedAtDesc()
                : orderRepository.findByUser_IdOrderByOrderedAtDesc(user.getId());
        return orders.stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        return OrderResponse.from(loadVisible(id));
    }

    @Transactional
    public OrderResponse updateOrder(Long id, UpdateOrderRequest request) {
        Order order = loadVisible(id);
        User user = currentUser();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ApiException(403, "You can only change an order you placed.");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException(409, "The kitchen has already started this order.");
        }
        Map<Long, BigDecimal> previousPrices = new LinkedHashMap<>();
        for (OrderItem item : order.getItems()) {
            previousPrices.putIfAbsent(item.getMenuItem().getId(), item.getUnitPrice());
        }
        order.getItems().clear();
        applyLines(order, request.items(), previousPrices);
        orderRepository.flush();
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = loadVisible(id);
        User user = currentUser();
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ApiException(403, "You can only cancel an order you placed.");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException(409, "Only a pending order can be cancelled.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.flush();
        releaseTable(order.getTable());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        if (!CurrentUser.isFloor()) {
            throw new ApiException(403, "Only the floor can change order status.");
        }
        if (!EnumSet.allOf(OrderStatus.class).contains(status)) {
            throw new ApiException(400, "Unknown order status.");
        }
        Order order = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ApiException(404, "That order does not exist."));
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.SERVED) {
            throw new ApiException(409, "This order is already " + order.getStatus().name().toLowerCase() + ".");
        }
        order.setStatus(status);
        orderRepository.flush();
        if (status == OrderStatus.SERVED || status == OrderStatus.CANCELLED) {
            releaseTable(order.getTable());
        } else {
            order.getTable().setStatus(TableStatus.OCCUPIED);
        }
        return OrderResponse.from(order);
    }

    private void applyLines(Order order, List<LineRequest> lines, Map<Long, BigDecimal> previousPrices) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        for (LineRequest line : lines) {
            merged.merge(line.menuItemId(), line.quantity(), Integer::sum);
        }
        if (merged.isEmpty()) {
            throw new ApiException(400, "Add at least one dish.");
        }
        for (Map.Entry<Long, Integer> entry : merged.entrySet()) {
            MenuItem item = menuItemRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ApiException(400, "A selected dish does not exist."));
            if (!item.isAvailable()) {
                throw new ApiException(400, item.getName() + " is not available.");
            }
            BigDecimal unitPrice = previousPrices.getOrDefault(entry.getKey(), item.getPrice());
            OrderItem orderItem = new OrderItem();
            orderItem.capture(item, entry.getValue(), unitPrice);
            order.addItem(orderItem);
        }
        order.calculateTotal();
    }

    private void releaseTable(RestaurantTable table) {
        boolean stillOpen = orderRepository.existsByTable_IdAndStatusNotIn(table.getId(), CLOSED);
        if (!stillOpen && table.getStatus() == TableStatus.OCCUPIED) {
            table.setStatus(TableStatus.AVAILABLE);
        }
    }

    private Order loadVisible(Long id) {
        Order order = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ApiException(404, "That order does not exist."));
        if (!CurrentUser.isFloor() && !order.getUser().getId().equals(currentUser().getId())) {
            throw new ApiException(403, "You can only view your own orders.");
        }
        return order;
    }

    private User currentUser() {
        return userRepository.findByUsername(CurrentUser.username())
                .orElseThrow(() -> new ApiException(401, "Sign in required."));
    }
}
