const masterSheetUrl = 'https://opensheet.elk.sh/1WcTbHLTOpUl-TK7r0rTWZ_PuT0umIaBc00tzGZozgFw/Sheet1';
        const productsPerPage = 4; // Number of products to show initially per brand section

        // Store product data and current index per brand
        const brandDataMap = {}; // { brandId: { allProducts: [], currentProductIndex: 0, brandName: '', category: '' } }
        const countdownIntervals = {}; // To store interval IDs for each brand's countdown
        let allBrandsData = []; // To store all brands from the master sheet for filtering

        // Hardcoded list of categories provided by the user
        const allCategories = [
            "Art & Painting", "Auto", "Baby, Kids & Toys", "Beauty", "Book Store", "Cafes",
            "Department Stores", "Desserts", "Electronics & Office Supplies", "Entertainment",
            "Experience", "Fashion", "Fast Food", "Fitness & Sports", "Flowers & Gifts",
            "Furniture & Appliances", "Gas", "Hardware", "Home Goods", "Hospitality",
            "Jewellery", "Medical", "Pharmacy", "Restaurant & Beverage", "Retail",
            "Shipping & Logistics", "Spas", "Supermarkets", "Travel & Hospitality",
            "Weddings and Events", "Women Apparel"
        ];

        /**
         * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
         * @param {Array} array The array to shuffle.
         * @returns {Array} The shuffled array (same reference).
         */
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Swap elements
            }
            return array;
        }

        function openPopup({ image, name, original, discount, description, brandName }) {
            const originalPrice = parseFloat(String(original).replace(/,/g, '')) || 0;
            const discountPrice = parseFloat(String(discount).replace(/,/g, '')) || 0;
            const percentOff = originalPrice && discountPrice ? Math.round((1 - discountPrice / originalPrice) * 100) : 0;

            document.getElementById('popupImg').src = image;
            document.getElementById('popupTitle').textContent = name;
            document.getElementById('popupBrand').textContent = brandName ? `${brandName}` : '';
            document.getElementById('popupPrice').textContent = `Original Price: JMD $${original}`;
            document.getElementById('popupDiscount').textContent = `Now: JMD $${discount}`;
            document.getElementById('popupDesc').textContent = description || '';
            document.getElementById('popupBadge').textContent = `${percentOff}% OFF`;
            document.getElementById('popup').style.display = 'flex';
        }

        function closePopup() {
            document.getElementById('popup').style.display = 'none';
        }

        // Function to load more deals for a specific brand
        function loadMoreDealsForBrand(brandId) {
            const brandData = brandDataMap[brandId];
            if (!brandData) return;

            const productsToAdd = brandData.allProducts.slice(brandData.currentProductIndex, brandData.currentProductIndex + productsPerPage);
            if (productsToAdd.length > 0) {
                const container = document.getElementById(`deals-container-${brandId}`);
                productsToAdd.forEach(row => {
                    const card = createDealCard(row);
                    if (card) {
                        container.appendChild(card);
                    }
                });
                brandData.currentProductIndex += productsToAdd.length;
                updateShopMoreButton(brandId);
            }
        }

        function createDealCard(row) {
            if (!row.ProductName || !row.ImageURL) {
                return null;
            }

            const original = parseFloat(String(row.OriginalPrice).replace(/,/g, '')) || 0;
            const discount = parseFloat(String(row.DiscountPrice).replace(/,/g, '')) || 0;
            const percentOff = original && discount ? Math.round((1 - discount / original) * 100) : 0;

            // Re-added truncation for product name
            const shortName = row.ProductName.length > 18 ? row.ProductName.slice(0, 17) + '...' : row.ProductName;

            const dealCard = document.createElement('div');
            dealCard.className = 'deal-card';
            dealCard.innerHTML = `
                <span class="discount-badge">SAVE ${percentOff}%</span>
                <img src="${row.ImageURL}" alt="${row.ProductName}" onerror="this.onerror=null;this.src='https://placehold.co/150x150/e0e0e0/555555?text=Product';">
                <div class="deal-content">
                   <div class="deal-title">${shortName}</div>
                   
                    <div class="price-section">
                        <div class="price-info">
                            <div class="discount-price">JMD $${discount.toLocaleString()}</div>
                            <div class="original-price">JMD $${original.toLocaleString()}</div>
                            <div class="product-brand-text">${'30 - 49% CashBack ¹²¹ '}</div>
                        </div>
                        <button class="add-to-cart-button">+</button>
                    </div>
                </div>
            `;
            dealCard.addEventListener('click', () => {
                openPopup({
                    image: row.ImageURL,
                    name: row.ProductName,
                    original: original.toLocaleString(),
                    discount: discount.toLocaleString(),
                    description: row.Description,
                    brandName: row.BrandName
                });
            });
            return dealCard;
        }

        // Renders initial set of products for a specific brand
        function renderInitialProducts(brandId, productsToRender) {
            const container = document.getElementById(`deals-container-${brandId}`);
            // Keep the category brand card if it exists, otherwise it will be re-added by renderBrandSection
            const existingCategoryBrandCard = container.querySelector(`#category-brand-card-${brandId}`);
            container.innerHTML = ''; // Clear existing content
            if (existingCategoryBrandCard) {
                container.appendChild(existingCategoryBrandCard); // Re-add the static card
            }

            productsToRender.forEach(row => {
                const card = createDealCard(row);
                if (card) {
                    container.appendChild(card);
                }
            });
            updateShopMoreButton(brandId);
        }

        // Updates "Shop More" button for a specific brand
        function updateShopMoreButton(brandId) {
            const brandData = brandDataMap[brandId];
            if (!brandData) return;

            const remainingCount = brandData.allProducts.length - brandData.currentProductIndex;
            const shopMoreButtonSpan = document.getElementById(`remaining-deals-count-${brandId}`);
            const shopMoreContainer = document.getElementById(`shop-more-container-${brandId}`);

            if (shopMoreButtonSpan && shopMoreContainer) {
                if (remainingCount > 0) {
                    shopMoreButtonSpan.textContent = remainingCount;
                    shopMoreContainer.style.display = 'flex';
                } else {
                    shopMoreContainer.style.display = 'none';
                }
            }
        }

        // Function to render a complete section for a single brand
        async function renderBrandSection(brandName, sheetUrl, brandId) {
            const allBrandsContainer = document.getElementById('all-brands-container');

            // Create the main section container for this brand
            const brandSection = document.createElement('div');
            brandSection.id = `brand-section-${brandId}`;
            brandSection.className = 'bg-white rounded-xl shadow-lg mb-8 overflow-hidden'; // Styling for each brand section
            brandSection.setAttribute('data-brand-name', brandName); // Add data attribute for brand name filtering

            // Add a temporary loading state for the brand section
            brandSection.innerHTML = `
               <div id="deals-container-${brandId}" class="deal-grid">
                    <!-- The special category brand card (now current brand info) -->
                    <div id="category-brand-card-${brandId}" class="category-icon-card">
                        <img id="category-brand-logo-${brandId}" src="https://placehold.co/80x80/ffffff/2C3E50?text=Loading" alt="Brand Logo" class="category-brand-logo">
                        <div id="category-brand-name-text-${brandId}" class="card-text">Loading ${brandName}...</div>
                        <div id="category-brand-countdown-${brandId}" class="countdown-text"></div>
                    </div>
                    <p class="col-span-full text-center text-gray-500 py-4" id="loading-deals-message-${brandId}">Fetching deals...</p>
                </div>
                <div id="shop-more-container-${brandId}" class="shop-more-deals-container">
                    <button id="shop-more-button-${brandId}" class="shop-more-button">
                         VIEW <span id="remaining-deals-count-${brandId}">0</span> MORE DEALS
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button> 
                </div> 
            `;
            allBrandsContainer.appendChild(brandSection);

            // Fetch deals for this specific brand
            try {
                const res = await fetch(sheetUrl);
                const rows = await res.json();
                
                let featuredBrandData = null;
                let tempProducts = [];
                for (const row of rows) {
                    // Check for a dedicated brand row (has BrandName, BrandLogo, ExpiryDate, PrimaryColor, SecondaryColor, Category but no ProductName)
                    if (row.BrandName && row.BrandLogo && row.ExpiryDate && (!row.ProductName || row.ProductName === "")) {
                        featuredBrandData = row;
                    } else if (row.ProductName && row.ImageURL) {
                        // This is a product row
                        tempProducts.push(row);
                    }
                }

                // If no products, remove the entire brand section
                if (tempProducts.length === 0) {
                    console.log(`Brand "${brandName}" has no products. Removing its section.`);
                    brandSection.remove();
                    return; // Exit the function, no need to render anything for this brand
                }

                // Shuffle products before storing them
                shuffleArray(tempProducts);

                // Store data for this brand, including its category
                brandDataMap[brandId] = {
                    allProducts: tempProducts,
                    currentProductIndex: 0,
                    brandName: brandName,
                    category: featuredBrandData ? featuredBrandData.Category : 'Uncategorized' // Assuming Category is in featuredBrandData
                };
                // Set data-category attribute on the brand section for filtering
                brandSection.setAttribute('data-category', brandDataMap[brandId].category.toLowerCase());


                // Update the Current Brand Info Card for this section
                const categoryBrandCard = document.getElementById(`category-brand-card-${brandId}`); // Get the card element
                const categoryBrandLogo = document.getElementById(`category-brand-logo-${brandId}`);
                const categoryBrandNameText = document.getElementById(`category-brand-name-text-${brandId}`);
                const categoryBrandCountdown = document.getElementById(`category-brand-countdown-${brandId}`);
                const loadingMessage = document.getElementById(`loading-deals-message-${brandId}`);
                if (loadingMessage) loadingMessage.remove();

                if (featuredBrandData) {
                    categoryBrandLogo.src = featuredBrandData.BrandLogo || 'https://placehold.co/80x80/ffffff/2C3E50?text=Brand+Logo';
                    categoryBrandLogo.alt = `${featuredBrandData.BrandName || ''} Brand Logo`;
                    categoryBrandNameText.textContent = featuredBrandData.BrandName || brandName;
                    if (featuredBrandData.ExpiryDate) {
                        startBrandCountdown(featuredBrandData.ExpiryDate, `category-brand-countdown-${brandId}`);
                    } else {
                        categoryBrandCountdown.textContent = '';
                    }

                    // Apply primary and secondary colors to the card background
                    const primaryColor = featuredBrandData.PrimaryColor;
                    const secondaryColor = featuredBrandData.SecondaryColor;

                    if (primaryColor && secondaryColor) {
                        categoryBrandCard.style.backgroundImage = `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})`;
                        categoryBrandCard.style.backgroundColor = ''; // Clear fallback background color
                    } else if (primaryColor) {
                        categoryBrandCard.style.backgroundColor = primaryColor;
                        categoryBrandCard.style.backgroundImage = '';
                    } else {
                        // Fallback to default if colors are not provided
                        categoryBrandCard.style.backgroundColor = '#2C3E50';
                        categoryBrandCard.style.backgroundImage = '';
                    }

                } else {
                    // Fallback if no dedicated brand row in the specific sheet
                    categoryBrandLogo.src = 'https://placehold.co/80x80/ffffff/2C3E50?text=Brand+Logo';
                    categoryBrandLogo.alt = `${brandName} Logo`;
                    categoryBrandNameText.textContent = brandName;
                    categoryBrandCountdown.textContent = ''; // No countdown if no specific expiry date found
                    categoryBrandCard.style.backgroundColor = '#2C3E50'; // Ensure default if no featured data
                    categoryBrandCard.style.backgroundImage = '';
                }

                // Render initial products for this brand
                renderInitialProducts(brandId, brandDataMap[brandId].allProducts.slice(0, productsPerPage));
                brandDataMap[brandId].currentProductIndex += productsPerPage;

                // Attach event listener to this brand's "Shop More Deals" button
                document.getElementById(`shop-more-button-${brandId}`).addEventListener('click', () => {
                    loadMoreDealsForBrand(brandId);
                });

            } catch (err) {
                console.error(`Failed to load deals for ${brandName}:`, err);
                // If there's an error fetching or parsing, also remove the section
                brandSection.remove();
            }
        }

        // Function to create a category item for the floating bar
        function createFloatingCategoryItem(categoryName) {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.setAttribute('data-filter-type', 'category');
            categoryItem.setAttribute('data-filter-value', categoryName.toLowerCase());
            
            // Removed the <img> tag as requested
            categoryItem.innerHTML = `
                <span class="category-name">${categoryName}</span>
            `;
            categoryItem.addEventListener('click', () => {
                filterContent('category', categoryName.toLowerCase());
                highlightCategory(categoryItem);
                brandSearchInput.value = ''; // Clear search input when a category is selected
            });
            return categoryItem;
        }

        // Function to highlight the active category item
        function highlightCategory(activeItem) {
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            activeItem.classList.add('active');
        }

        // Function to load the master sheet and populate all brand sections and floating categories
        async function loadMasterSheet() {
            const loadingBrandsMessage = document.getElementById('loading-brands-message');
            if (loadingBrandsMessage) loadingBrandsMessage.textContent = 'Loading all brands and their deals...';

            try {
                const res = await fetch(masterSheetUrl);
                const brands = await res.json();
                allBrandsData = brands; // Store all brands data globally

                // Clear the initial loading message
                const allBrandsContainer = document.getElementById('all-brands-container');
                allBrandsContainer.innerHTML = '';

                if (brands.length === 0) {
                    allBrandsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 py-4">No brands found in the master sheet.</p>';
                    return;
                }

                const categoriesList = document.getElementById('categories-list');
                // Ensure "All Categories" is always the first item and active by default
                const allCategoriesItem = categoriesList.querySelector('[data-filter-value="all"]');
                if (allCategoriesItem) {
                    allCategoriesItem.addEventListener('click', () => {
                        filterContent('category', 'all');
                        highlightCategory(allCategoriesItem);
                        brandSearchInput.value = ''; // Clear search input
                    });
                }

                // Populate floating categories from the hardcoded list
                allCategories.forEach(category => {
                    const categoryItem = createFloatingCategoryItem(category);
                    categoriesList.appendChild(categoryItem);
                });


                // Render each brand section
                for (const brand of brands) {
                    const brandName = brand.undefined; // Assuming 'undefined' column holds the brand name
                    const sheetUrl = brand.sheeturls;

                    if (brandName && sheetUrl) {
                        // Create a unique ID for each brand's section
                        const brandId = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                        
                        // Render the main brand section
                        await renderBrandSection(brandName, sheetUrl, brandId);
                    }
                }
                
                // If after trying to load all brands, no sections are visible
                if (allBrandsContainer.children.length === 0) {
                    allBrandsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 py-4">No brands with products found.</p>';
                }


            } catch (err) {
                console.error('Failed to load master sheet:', err);
                document.getElementById('all-brands-container').innerHTML = '<p class="col-span-full text-center text-red-500 py-4">Failed to load brand list. Please check the master sheet URL.</p>';
            }
        }

        function startBrandCountdown(expireDate, elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;

            // Clear any existing interval for this element to prevent multiple timers
            if (countdownIntervals[elementId]) {
                clearInterval(countdownIntervals[elementId]);
            }

            function update() {
                const timeLeft = new Date(expireDate) - new Date();
                if (timeLeft <= 0) {
                    el.textContent = 'Deal ended';
                    clearInterval(countdownIntervals[elementId]);
                    delete countdownIntervals[elementId];
                } else {
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hrs = String(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / 3600000)).padStart(2, '0');
                    const mins = String(Math.floor((timeLeft % 3600000) / 60000)).padStart(2, '0');
                    const secs = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0');
                    
                    let timeString = '';
                    if (days > 0) {
                        timeString += `${days}d `;
                    }
                    timeString += `${hrs}:${mins}:${secs}`;

                    el.textContent = `Ends in: ${timeString}`;
                }
            }

            update(); // Initial call to display immediately
            countdownIntervals[elementId] = setInterval(update, 1000); // Store interval ID
        }

        // Search and Filter functionality
        const brandSearchInput = document.getElementById('brandSearchInput');
        let searchTimeout;

        function filterContent(filterType, filterValue) {
            const normalizedFilterValue = filterValue.toLowerCase().trim();
            const allBrandSections = document.querySelectorAll('[id^="brand-section-"]');
            let foundContent = false;

            allBrandSections.forEach(section => {
                const brandName = section.getAttribute('data-brand-name').toLowerCase();
                const category = section.getAttribute('data-category').toLowerCase();
                
                let shouldShow = false;

                if (filterType === 'category') {
                    if (normalizedFilterValue === 'all' || category.includes(normalizedFilterValue)) {
                        shouldShow = true;
                    }
                } else if (filterType === 'brand') {
                    if (brandName.includes(normalizedFilterValue)) {
                        shouldShow = true;
                    }
                }

                if (shouldShow) {
                    section.style.display = 'block';
                    foundContent = true;
                } else {
                    section.style.display = 'none';
                }
            });

            const allBrandsContainer = document.getElementById('all-brands-container');
            let noResultsMessage = document.getElementById('no-results-message');

            if (!foundContent && normalizedFilterValue !== '' && normalizedFilterValue !== 'all') {
                if (!noResultsMessage) {
                    noResultsMessage = document.createElement('p');
                    noResultsMessage.id = 'no-results-message';
                    noResultsMessage.className = 'col-span-full text-center text-gray-500 py-8 text-xl';
                    allBrandsContainer.appendChild(noResultsMessage);
                }
                noResultsMessage.textContent = `No content found matching "${normalizedFilterValue}".`;
            } else if (noResultsMessage) {
                noResultsMessage.remove();
            }
        }

        brandSearchInput.addEventListener('keyup', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterContent('brand', brandSearchInput.value);
                // Remove active highlight from category items when typing in search
                document.querySelectorAll('.category-item').forEach(item => {
                    item.classList.remove('active');
                });
            }, 300); // Debounce for 300ms
        });

        document.addEventListener('DOMContentLoaded', () => {
            loadMasterSheet();
        });
        
        document.getElementById('popup').addEventListener('click', function (e) {
            if (e.target === this) {
                closePopup();
            }
        });
