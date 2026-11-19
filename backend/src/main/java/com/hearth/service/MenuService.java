package com.hearth.service;

import com.hearth.domain.MenuCategory;
import com.hearth.domain.MenuItem;
import com.hearth.error.ApiException;
import com.hearth.repo.MenuCategoryRepository;
import com.hearth.repo.MenuItemRepository;
import com.hearth.repo.OrderItemRepository;
import com.hearth.web.dto.MenuDtos.CategoryRequest;
import com.hearth.web.dto.MenuDtos.CategoryResponse;
import com.hearth.web.dto.MenuDtos.ItemRequest;
import com.hearth.web.dto.MenuDtos.ItemResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;

@Service
public class MenuService {

    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final OrderItemRepository orderItemRepository;

    public MenuService(
            MenuCategoryRepository categoryRepository,
            MenuItemRepository itemRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ApiException(409, "A category with that name already exists.");
        }
        MenuCategory category = new MenuCategory();
        category.setName(name);
        category.setDescription(blankToNull(request.description()));
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        MenuCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That category does not exist."));
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ApiException(409, "A category with that name already exists.");
        }
        category.setName(name);
        category.setDescription(blankToNull(request.description()));
        return CategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        MenuCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That category does not exist."));
        if (itemRepository.countByCategory_Id(id) > 0) {
            throw new ApiException(409, "Move or remove the dishes in this category first.");
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> getMenuItems() {
        return itemRepository.findAllByOrderByCategory_NameAscNameAsc().stream().map(ItemResponse::from).toList();
    }

    @Transactional
    public ItemResponse createMenuItem(ItemRequest request) {
        MenuCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ApiException(400, "Choose a category that exists."));
        MenuItem item = new MenuItem();
        apply(item, category, request);
        return ItemResponse.from(itemRepository.save(item));
    }

    @Transactional
    public ItemResponse updateMenuItem(Long id, ItemRequest request) {
        MenuItem item = itemRepository.findWithCategoryById(id)
                .orElseThrow(() -> new ApiException(404, "That dish does not exist."));
        MenuCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ApiException(400, "Choose a category that exists."));
        apply(item, category, request);
        return ItemResponse.from(item);
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That dish does not exist."));
        if (orderItemRepository.existsByMenuItem_Id(id)) {
            throw new ApiException(409, "This dish is on past orders. Mark it unavailable instead.");
        }
        itemRepository.delete(item);
    }

    private void apply(MenuItem item, MenuCategory category, ItemRequest request) {
        item.setCategory(category);
        item.setName(request.name().trim());
        item.setDescription(blankToNull(request.description()));
        item.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        item.setAvailable(request.available());
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
