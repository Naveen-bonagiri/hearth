package com.hearth.config;

import com.hearth.domain.MenuCategory;
import com.hearth.domain.MenuItem;
import com.hearth.domain.Order;
import com.hearth.domain.OrderItem;
import com.hearth.domain.OrderStatus;
import com.hearth.domain.Permission;
import com.hearth.domain.RestaurantTable;
import com.hearth.domain.Role;
import com.hearth.domain.TableStatus;
import com.hearth.domain.User;
import com.hearth.repo.MenuCategoryRepository;
import com.hearth.repo.MenuItemRepository;
import com.hearth.repo.OrderRepository;
import com.hearth.repo.PermissionRepository;
import com.hearth.repo.RoleRepository;
import com.hearth.repo.TableRepository;
import com.hearth.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String PASSWORD = "Password123!";
    private static final List<String> PERMISSIONS = List.of(
            "MENU_VIEW",
            "MENU_MANAGE",
            "ORDER_CREATE",
            "ORDER_VIEW",
            "ORDER_UPDATE",
            "ORDER_CANCEL",
            "TABLE_VIEW",
            "TABLE_MANAGE",
            "STAFF_MANAGE",
            "USER_MANAGE",
            "ROLE_MANAGE",
            "REPORT_VIEW"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            MenuCategoryRepository categoryRepository,
            MenuItemRepository itemRepository,
            TableRepository tableRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByUsername("admin")) {
            log.info("Hearth is ready. Seed accounts already exist.");
            return;
        }
        Map<String, Permission> permissions = seedPermissions();
        Map<String, Role> roles = seedRoles(permissions);
        User customer = seedUsers(roles);
        Map<String, MenuItem> menu = seedMenu();
        Map<String, RestaurantTable> tables = seedTables();
        seedOrders(customer, menu, tables);
        log.info("Hearth seeded. Sign in as admin, manager, staff, or customer. Shared password: {}", PASSWORD);
    }

    private Map<String, Permission> seedPermissions() {
        Map<String, Permission> saved = new LinkedHashMap<>();
        for (String name : PERMISSIONS) {
            Permission permission = new Permission();
            permission.setName(name);
            saved.put(name, permissionRepository.save(permission));
        }
        return saved;
    }

    private Map<String, Role> seedRoles(Map<String, Permission> permissions) {
        Map<String, List<String>> matrix = new LinkedHashMap<>();
        matrix.put("CUSTOMER", List.of("MENU_VIEW", "ORDER_CREATE", "ORDER_VIEW", "ORDER_UPDATE", "ORDER_CANCEL"));
        matrix.put("STAFF", List.of("MENU_VIEW", "ORDER_CREATE", "ORDER_VIEW", "ORDER_UPDATE", "TABLE_VIEW"));
        matrix.put("MANAGER", List.of(
                "MENU_VIEW", "MENU_MANAGE",
                "ORDER_CREATE", "ORDER_VIEW", "ORDER_UPDATE",
                "TABLE_VIEW", "TABLE_MANAGE",
                "STAFF_MANAGE", "REPORT_VIEW"));
        matrix.put("ADMIN", PERMISSIONS);

        Map<String, Role> saved = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : matrix.entrySet()) {
            Role role = new Role();
            role.setName(entry.getKey());
            for (String permissionName : entry.getValue()) {
                role.getPermissions().add(permissions.get(permissionName));
            }
            saved.put(role.getName(), roleRepository.save(role));
        }
        return saved;
    }

    private User seedUsers(Map<String, Role> roles) {
        User customer = null;
        customer = user("customer", "customer@hearth.test", roles.get("CUSTOMER"));
        user("staff", "staff@hearth.test", roles.get("STAFF"));
        user("manager", "manager@hearth.test", roles.get("MANAGER"));
        user("admin", "admin@hearth.test", roles.get("ADMIN"));
        return customer;
    }

    private User user(String username, String email, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setEnabled(true);
        user.getRoles().add(role);
        return userRepository.save(user);
    }

    private Map<String, MenuItem> seedMenu() {
        MenuCategory starters = category("Starters", "Small plates while the fire settles.");
        MenuCategory mains = category("From the fire", "The short list we cook every night.");
        MenuCategory sides = category("Sides", "To share down the table.");
        MenuCategory afters = category("After", "Something sweet, and a glass.");

        Map<String, MenuItem> menu = new LinkedHashMap<>();
        menu.put("olives", item(starters, "Warm olives", "Citrus peel, chili, and olive oil.", "6.00"));
        menu.put("bread", item(starters, "Hearth bread", "Brown butter and sea salt.", "5.00"));
        menu.put("soup", item(starters, "Roasted squash soup", "Brown butter, pepitas, and cream.", "9.00"));
        menu.put("chicken", item(mains, "Wood-fired chicken", "Half a bird, charred lemon, pan juices.", "24.00"));
        menu.put("pasta", item(mains, "Mushroom pappardelle", "Thyme, parmesan, and a little cream.", "21.00"));
        menu.put("steak", item(mains, "Cast-iron steak", "Pepper crust, red wine butter.", "32.00"));
        menu.put("fish", item(mains, "Market fish", "Whatever came in, grilled simply.", "28.00"));
        menu.put("greens", item(sides, "Charred greens", "Garlic, lemon, and chili.", "8.00"));
        menu.put("potatoes", item(sides, "Rosemary potatoes", "Crisp edges, soft centers.", "7.00"));
        menu.put("cake", item(afters, "Olive oil cake", "Citrus, whipped cream.", "10.00"));
        menu.put("chocolate", item(afters, "Dark chocolate pot", "Olive oil and flaky salt.", "9.00"));
        menu.put("red", item(afters, "House red", "A glass of the evening pour.", "11.00"));
        return menu;
    }

    private MenuCategory category(String name, String description) {
        MenuCategory category = new MenuCategory();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    private MenuItem item(MenuCategory category, String name, String description, String price) {
        MenuItem item = new MenuItem();
        item.setCategory(category);
        item.setName(name);
        item.setDescription(description);
        item.setPrice(new BigDecimal(price));
        item.setAvailable(true);
        return itemRepository.save(item);
    }

    private Map<String, RestaurantTable> seedTables() {
        Map<String, RestaurantTable> tables = new LinkedHashMap<>();
        tables.put("1", table("1", 2, TableStatus.OCCUPIED));
        tables.put("2", table("2", 2, TableStatus.AVAILABLE));
        tables.put("3", table("3", 4, TableStatus.OCCUPIED));
        tables.put("4", table("4", 4, TableStatus.AVAILABLE));
        tables.put("5", table("5", 6, TableStatus.RESERVED));
        tables.put("6", table("6", 8, TableStatus.AVAILABLE));
        return tables;
    }

    private RestaurantTable table(String number, int capacity, TableStatus status) {
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(number);
        table.setCapacity(capacity);
        table.setStatus(status);
        return tableRepository.save(table);
    }

    private void seedOrders(User customer, Map<String, MenuItem> menu, Map<String, RestaurantTable> tables) {
        order(customer, tables.get("1"), OrderStatus.PENDING, List.of(
                line(menu.get("chicken"), 1),
                line(menu.get("greens"), 1),
                line(menu.get("red"), 1)
        ));
        order(customer, tables.get("3"), OrderStatus.PREPARING, List.of(
                line(menu.get("pasta"), 1),
                line(menu.get("bread"), 1),
                line(menu.get("cake"), 1)
        ));
    }

    private OrderItem line(MenuItem item, int quantity) {
        OrderItem orderItem = new OrderItem();
        orderItem.capture(item, quantity, item.getPrice());
        return orderItem;
    }

    private void order(User user, RestaurantTable table, OrderStatus status, List<OrderItem> lines) {
        Order order = new Order();
        order.setUser(user);
        order.setTable(table);
        order.setStatus(status);
        order.setOrderedAt(LocalDateTime.now().minusMinutes(status == OrderStatus.PENDING ? 12 : 40));
        for (OrderItem line : lines) {
            order.addItem(line);
        }
        order.calculateTotal();
        orderRepository.save(order);
    }
}
