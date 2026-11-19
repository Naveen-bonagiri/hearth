package com.hearth.web;

import com.hearth.service.MenuService;
import com.hearth.web.dto.MenuDtos.CategoryRequest;
import com.hearth.web.dto.MenuDtos.CategoryResponse;
import com.hearth.web.dto.MenuDtos.ItemRequest;
import com.hearth.web.dto.MenuDtos.ItemResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return menuService.getCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return menuService.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return menuService.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public void deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
    }

    @GetMapping("/items")
    public List<ItemResponse> getMenuItems() {
        return menuService.getMenuItems();
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public ItemResponse createMenuItem(@Valid @RequestBody ItemRequest request) {
        return menuService.createMenuItem(request);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public ItemResponse updateMenuItem(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
        return menuService.updateMenuItem(id, request);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('MENU_MANAGE')")
    public void deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
    }
}
