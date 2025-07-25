        const masterSheetUrl = 'https://opensheet.elk.sh/1WcTbHLTOpUl-TK7r0rTWZ_PuT0umIaBc00tzGZozgFw/Sheet1';
        const rankedSlotsUrl = 'https://opensheet.elk.sh/1_DyGLoYi5ndEkiwhPEzJhMc3vciIFNhN2g-H0gbVRds/sheet2';
        const SpecialBrandUrl = 'https://opensheet.elk.sh/1_DyGLoYi5ndEkiwhPEzJhMc3vciIFNhN2g-H0gbVRds/sheet1'; // Corrected variable name
        const productsPerPage = 4; // Number of products to show initially per brand section for individual brand sections
        const brandsPerPage = 1; // Number of brands to show initially for the main list

        // Store product data and current index per brand
        const brandDataMap = {}; // { brandId: { allProducts: [], currentProductIndex: 0, brandName: '', category: '', parish: '', town: '' } }
        const countdownIntervals = {}; // To store interval IDs for each brand's countdown

        // These will now be dynamically populated
        let dynamicJamaicanLocations = {
            "All Parishes": ["All Towns"]
        };
        let dynamicCategories = new Set(); // Using a Set to store unique categories

        let firstBrandLoaded = false; // Flag to track if the first brand has been loaded
        let selectedFeaturedBrandId = null; // New: To store the currently selected featured brand
        let currentSpecialBrandData = null; // To store the data for the currently active special brand
        let filteredBrandIds = []; // Stores the IDs of brands that match current filters
        let currentMainBrandIndex = 0; // Tracks the current number of brands displayed in the main list
        let autoLoadCount = 0; // Tracks how many times auto-load has occurred for the main list
        const maxAutoLoads = 3; // Maximum number of automatic loads
        let intersectionObserver; // IntersectionObserver instance

        /**
         * Shows the loading overlay.
         */
        function showLoadingOverlay() {
            document.getElementById('loading-overlay').classList.remove('hidden');
            console.log("[Loading Overlay] Showing loading overlay.");
        }

        /**
         * Hides the loading overlay.
         */
        function hideLoadingOverlay() {
            document.getElementById('loading-overlay').classList.add('hidden');
            console.log("[Loading Overlay] Hiding loading overlay.");
        }

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

        /**
         * Opens the deal popup with the given product details.
         * @param {Object} deal - Object containing deal details (image, name, original, discount, description, brandName).
         */
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

        /**
         * Closes the deal popup.
         */
        function closePopup() {
            document.getElementById('popup').style.display = 'none';
        }

        /**
         * Loads more deals for a specific brand section.
         * @param {string} brandId - The unique ID of the brand.
         */
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

        /**
         * Loads more deals for the special brand section.
         */
        function loadMoreDealsForSpecialBrand() {
            if (!currentSpecialBrandData) return;

            const productsToAdd = currentSpecialBrandData.allProducts.slice(currentSpecialBrandData.currentProductIndex, currentSpecialBrandData.currentProductIndex + productsPerPage);
            if (productsToAdd.length > 0) {
                const container = document.getElementById('todays-special-brand-content');
                productsToAdd.forEach(row => {
                    const card = createDealCard(row);
                    if (card) {
                        container.appendChild(card);
                    }
                });
                currentSpecialBrandData.currentProductIndex += productsToAdd.length;
                updateShopMoreButtonForSpecialBrand();
            }
        }

        /**
         * Creates an HTML deal card element from product row data.
         * @param {Object} row - The product data row from the sheet.
         * @returns {HTMLElement|null} The created deal card element or null if data is incomplete.
         */
        function createDealCard(row) {
            if (!row.ProductName || !row.ImageURL) {
                return null;
            }

            const original = parseFloat(String(row.OriginalPrice).replace(/,/g, '')) || 0;
            const discount = parseFloat(String(row.DiscountPrice).replace(/,/g, '')) || 0;
            const percentOff = original && discount ? Math.round((1 - discount / original) * 100) : 0;

            const shortName = row.ProductName.length > 18 ? row.ProductName.slice(0, 17) + '...' : row.ProductName;

            const dealCard = document.createElement('div');
            dealCard.className = 'deal-card';

            dealCard.innerHTML = `
                <span class="discount-badge">SAVE ${percentOff}%</span>
                <img src="${row.ImageURL}" alt="${row.ProductName}" onerror="this.onerror=null;this.src='https://placehold.co/150x150/e0e0e0/555555?text=Product';">
                <div class="deal-content">
                    <div class="product-brand-text">${row.BrandName || ''}</div>
                    <div class="deal-title">${shortName}</div>
                    <div class="price-section">
                        <div class="price-info">
                            <div class="discount-price">JMD $${discount.toLocaleString()}</div>
                            <div class="original-price">JMD $${original.toLocaleString()}</div>
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
                    brandName: row.BrandName // Use brand name from the product row for popup
                });
            });
            return dealCard;
        }

        /**
         * Renders the initial set of products for a specific brand's section.
         * @param {string} brandId - The unique ID of the brand.
         * @param {Array} productsToRender - Array of product objects to render.
         * @param {HTMLElement} container - The HTML element to append products to.
         * @param {boolean} isSpecialBrandSection - True if rendering for the special brand section.
         */
        function renderInitialProducts(brandId, productsToRender, container, isSpecialBrandSection = false) {
            container.innerHTML = ''; // Clear existing content

            // Create and prepend the brand info card first
            const brandData = isSpecialBrandSection ? currentSpecialBrandData : brandDataMap[brandId];
            const brandInfoCard = createBrandInfoCard(
                brandData.brandName,
                brandData.brandId,
                brandData.brandLogo,
                brandData.brandColor,
                brandData.brandImage,
                brandData.category,
                brandData.parish,
                brandData.town, // Pass town data
                brandData.expiryDate,
                brandData.brandSecondaryColor, // Pass secondary color
                brandData.cashbackStatus // Pass cashback status
            );
            if (brandInfoCard) {
                container.appendChild(brandInfoCard); // Append first, then products
            }

            productsToRender.forEach(row => {
                const card = createDealCard(row);
                if (card) {
                    container.appendChild(card);
                }
            });

            if (isSpecialBrandSection) {
                updateShopMoreButtonForSpecialBrand();
            } else {
                updateShopMoreButton(brandId);
            }
        }

        /**
         * Creates the dedicated brand information card to be placed in the grid.
         * @param {string} brandName - The name of the brand.
         * @param {string} brandId - The unique ID for the brand.
         * @param {string} brandLogo - URL to the brand's logo.
         * @param {string} brandColor - Primary background color for the brand card.
         * @param {string} brandImage - Background image URL for the brand card.
         * @param {string} category - The category of the brand.
         * @param {string} parish - The parish where the brand is located.
         * @param {string} town - The town where the brand is located.
         * @param {string} expiryDate - The expiry date of the deal for countdown.
         * @param {string} secondaryColor - The secondary background color for the brand card (optional).
         * @param {string} cashbackStatus - The cashback status ('yes' or 'no' or empty).
         * @returns {HTMLElement} The created brand info card element.
         */
        function createBrandInfoCard(brandName, brandId, brandLogo, brandColor, brandImage, category, parish, town, expiryDate, secondaryColor, cashbackStatus) {
            const brandInfoCard = document.createElement('div');
            brandInfoCard.className = 'brand-info-card-grid-item'; // New class for styling as a grid item
            brandInfoCard.id = `brand-info-card-${brandId}`;

            let backgroundStyle = '';
            if (brandImage) {
                backgroundStyle = `background-image: url('${brandImage}'); background-size: cover; background-position: center;`;
            } else if (brandColor && secondaryColor) { // If both primary and secondary colors are present
                backgroundStyle = `background: linear-gradient(to right, ${brandColor}, ${secondaryColor});`;
            } else if (brandColor) { // Fallback to solid primary color
                backgroundStyle = `background-color: ${brandColor};`;
            }
            brandInfoCard.style = backgroundStyle;

            // Conditional rendering for cashback text on the brand info card
            let cashbackTextHtml = '';
            if (cashbackStatus && String(cashbackStatus).toLowerCase() === 'yes') {
                cashbackTextHtml = `<p class="cashback-brand-text">30 - 49% CashBack ¹²¹</p>`;
            }

            brandInfoCard.innerHTML = `
                <img src="${brandLogo}" alt="${brandName} Logo" class="brand-logo-grid">
                <p class="brand-name-grid">${brandName}</p>
                <p class="category-parish-text">${category}</p>
                <p class="category-parish-text">${parish || 'N/A'}${town ? ': ' + town : ''}</p>
                ${cashbackTextHtml} <!-- Insert cashback text here -->
                <p id="countdown-${brandId}" class="countdown-text-grid"></p>
            `;

            const countdownElement = brandInfoCard.querySelector(`#countdown-${brandId}`);

            if (expiryDate) {
                const endDate = new Date(expiryDate).getTime();
                console.log(`[Timer Debug] Brand: ${brandName}, Raw ExpiryDate: "${expiryDate}", Parsed endDate (ms): ${endDate}, isNaN: ${isNaN(endDate)}`);

                if (!isNaN(endDate)) {
                    updateCountdown(brandId, endDate, countdownElement); // Pass the element directly
                } else {
                    if (countdownElement) {
                        countdownElement.textContent = "Invalid Expiry Date";
                        countdownElement.classList.add('error'); // Add error class
                    }
                }
            } else {
                if (countdownElement) {
                    countdownElement.textContent = "No Expiry Date Provided";
                    countdownElement.classList.add('error'); // Add error class
                }
            }
            return brandInfoCard;
        }


        /**
         * Updates the "Shop More Deals" button for a specific brand section.
         * @param {string} brandId - The unique ID of the brand.
         */
        function updateShopMoreButton(brandId) {
            const brandData = brandDataMap[brandId];
            if (!brandData) return;

            // Subtract 1 from allProducts.length because the first "product" is now the brand info card
            const remainingCount = (brandData.allProducts.length - brandData.currentProductIndex);
            const shopMoreButtonSpan = document.getElementById(`shop-more-count-${brandId}`);
            const shopMoreButtonContainer = document.getElementById(`shop-more-container-${brandId}`);

            if (shopMoreButtonSpan && shopMoreButtonContainer) {
                // The button should only show if there are actual products remaining
                if (remainingCount > 0) {
                    shopMoreButtonSpan.textContent = `View ${remainingCount} More Deals`;
                    shopMoreButtonContainer.classList.remove('hidden');
                } else {
                    shopMoreButtonContainer.classList.add('hidden');
                }
            }
        }

        /**
         * Updates the "Shop More Deals" button for the special brand section.
         */
        function updateShopMoreButtonForSpecialBrand() {
            if (!currentSpecialBrandData) return;

            const remainingCount = (currentSpecialBrandData.allProducts.length - currentSpecialBrandData.currentProductIndex);
            const shopMoreButtonSpan = document.getElementById(`shop-more-count-special`);
            const shopMoreButtonContainer = document.getElementById(`shop-more-container-special`);

            if (shopMoreButtonSpan && shopMoreButtonContainer) {
                if (remainingCount > 0) {
                    shopMoreButtonSpan.textContent = `View ${remainingCount} More Deals`;
                    shopMoreButtonContainer.classList.remove('hidden');
                } else {
                    shopMoreButtonContainer.classList.add('hidden');
                }
            }
        }

        /**
         * Updates the countdown timer for a specific brand.
         * @param {string} brandId - The unique ID of the brand.
         * @param {number} endDate - The timestamp (milliseconds) when the deal ends.
         * @param {HTMLElement} countdownElement - The actual element to update.
         */
        function updateCountdown(brandId, endDate, countdownElement) {
            if (!countdownElement) return;

            // Clear any existing interval for this brand to prevent duplicates
            if (countdownIntervals[brandId]) {
                clearInterval(countdownIntervals[brandId]);
            }

            const intervalId = setInterval(() => {
                const now = new Date().getTime();
                const distance = endDate - now;

                if (distance < 0) {
                    countdownElement.textContent = "Deal Ended";
                    clearInterval(intervalId);
                    delete countdownIntervals[brandId];
                    return;
                }

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                countdownElement.textContent = `Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
            }, 1000);

            countdownIntervals[brandId] = intervalId; // Store the interval ID
        }

        /**
         * Renders a complete section for a single brand on the page.
         * @param {string} brandName - The name of the brand.
         * @param {string} brandId - The unique ID for the brand.
         * @param {string} brandLogo - URL to the brand's logo.
         * @param {string} brandColor - Primary background color for the brand card.
         * @param {string} brandImage - Background image URL for the brand card.
         * @param {string} category - The category of the brand.
         * @param {string} parish - The parish where the brand is located.
         * @param {string} town - The town where the brand is located.
         * @param {string} expiryDate - The expiry date of the deal for countdown.
         * @param {string} secondaryColor - The secondary background color for the brand card (optional).
         * @param {string} cashbackStatus - The cashback status ('yes' or 'no' or empty).
         */
        function renderBrandSection(brandName, brandId, brandLogo, brandColor, brandImage, category, parish, town, expiryDate, secondaryColor, cashbackStatus) {
            const allBrandsContainer = document.getElementById('all-brands-container');
            const brandSection = document.createElement('section');
            brandSection.id = `brand-section-${brandId}`;
            brandSection.className = 'bg-white rounded-2xl shadow-lg mb-8 overflow-hidden';
            brandSection.setAttribute('data-brand-name', brandName);
            brandSection.setAttribute('data-category', category.toLowerCase());
            brandSection.setAttribute('data-parish', (parish || '').toLowerCase()); // Ensure parish is always a string for data attribute
            brandSection.setAttribute('data-town', (town || '').toLowerCase()); // Ensure town is always a string for data attribute

            const brandProducts = brandDataMap[brandId].allProducts;
            // Initial products will be productsPerPage, but the first slot is for the brand info card
            const initialProductsToDisplay = brandProducts.slice(0, productsPerPage);
            brandDataMap[brandId].currentProductIndex = initialProductsToDisplay.length;


            brandSection.innerHTML = `
                <div id="deals-container-${brandId}" class="deal-grid">
                    <!-- Brand Info Card and Deals will be inserted here -->
                </div>
                <div id="shop-more-container-${brandId}" class="shop-more-deals-container ${brandProducts.length <= productsPerPage ? 'hidden' : ''}">
                    <button class="shop-more-button" onclick="loadMoreDealsForBrand('${brandId}')">
                        <span id="shop-more-count-${brandId}">View ${brandProducts.length - initialProductsToDisplay.length} More Deals</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 21l-8-8 1.41-1.41L11 17.17V3h2v14.17l5.59-5.58L20 13z"/></svg>
                    </button>
                </div>
            `;
            allBrandsContainer.appendChild(brandSection);

            renderInitialProducts(brandId, initialProductsToDisplay, document.getElementById(`deals-container-${brandId}`)); // Pass the container
        }

        /**
         * Fetches all brand data from the master sheet and individual brand sheets,
         * populates the brandDataMap, and then applies filters to render content.
         */
        async function fetchAndProcessData() {
            showLoadingOverlay(); // Show loading overlay at the start
            const loadingMessage = document.getElementById('loading-brands-message');
            if (loadingMessage) loadingMessage.textContent = 'Loading all brands and their deals...';
            console.log("[Data Fetch] Starting fetch and process data...");

            // Reset dynamicJamaicanLocations and dynamicCategories before fetching new data
            dynamicJamaicanLocations = { "All Parishes": ["All Towns"] };
            dynamicCategories = new Set();
            firstBrandLoaded = false; // Reset flag for new data fetch
            selectedFeaturedBrandId = null; // Reset featured brand selection

            try {
                const masterRes = await fetch(masterSheetUrl);
                const masterBrands = await masterRes.json();
                console.log("[Data Fetch] Master sheet loaded:", masterBrands);

                // Clear previous brandDataMap and countdown intervals
                Object.keys(brandDataMap).forEach(key => delete brandDataMap[key]);
                Object.keys(countdownIntervals).forEach(key => clearInterval(countdownIntervals[key]));

                const allBrandsContainer = document.getElementById('all-brands-container');
                allBrandsContainer.innerHTML = ''; // Clear existing content

                if (masterBrands.length === 0) {
                    allBrandsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 py-4">No brands found in the master sheet.</p>';
                    console.log("[Data Fetch] No brands found in master sheet. Hiding loading message.");
                    hideLoadingOverlay(); // Hide on no brands
                    return;
                }

                const brandPromises = masterBrands.map(async (brandEntry) => {
                    const brandName = brandEntry.BrandName || brandEntry.undefined;
                    const sheetUrl = brandEntry.sheeturls;

                    if (!brandName || !sheetUrl) {
                        console.warn(`[Data Fetch] Skipping brand entry due to missing name or sheet URL:`, brandEntry);
                        return null;
                    }

                    const brandId = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                    console.log(`[Data Fetch] Processing brand: "${brandName}" (ID: ${brandId}), URL: ${sheetUrl}`);

                    try {
                        const res = await fetch(sheetUrl);
                        const rows = await res.json();
                        console.log(`[Data Fetch] Sheet data for "${brandName}" loaded:`, rows);

                        let featuredBrandData = null;
                        let tempProducts = [];
                        let brandParish = '';
                        let brandTown = '';
                        let brandCategory = 'Uncategorized';
                        let brandLogo = 'https://placehold.co/150x120/2C3E50/ffffff?text=Logo';
                        let brandColor = '#2C3E50';
                        let brandSecondaryColor = '';
                        let brandImage = '';
                        let expiryDate = null;
                        let cashbackStatus = ''; // Initialize cashback status for the brand

                        for (const row of rows) {
                            // Identify the brand's main information row (no ProductName or empty ProductName)
                            if (row.BrandName && row.BrandLogo && row.ExpiryDate && (!row.ProductName || row.ProductName.trim() === "")) {
                                featuredBrandData = row;
                                brandParish = (row.Parish || '').trim();
                                brandTown = (row.Town || '').trim();
                                brandCategory = (row.Category || 'Uncategorized').trim();
                                brandLogo = row.BrandLogo;
                                brandColor = row.PrimaryColor || '#2C3E50';
                                brandSecondaryColor = row.SecondaryColor || '';
                                brandImage = row.BrandImage || '';
                                expiryDate = row.ExpiryDate;
                                cashbackStatus = (row.Cashback || '').trim(); // Extract cashback status from brand row

                                // Dynamically populate jamaicanLocations
                                if (brandParish) {
                                    if (!dynamicJamaicanLocations[brandParish]) {
                                        dynamicJamaicanLocations[brandParish] = ["All Towns"];
                                    }
                                    if (brandTown && !dynamicJamaicanLocations[brandParish].includes(brandTown)) {
                                        dynamicJamaicanLocations[brandParish].push(brandTown);
                                    }
                                }
                                // Dynamically populate categories
                                if (brandCategory && brandCategory !== 'Uncategorized') {
                                    dynamicCategories.add(brandCategory);
                                }

                                console.log(`[Data Fetch] Found brand info row for "${brandName}": Category="${brandCategory}", Parish="${brandParish}", Town="${brandTown}", ExpiryDate="${expiryDate}", Cashback="${cashbackStatus}"`);
                            } else if (row.ProductName && row.ImageURL) {
                                // This is a product row
                                tempProducts.push(row);
                            }
                        }

                        // Ensure featuredBrandData was found. If not, this brand's sheet structure might be off.
                        if (!featuredBrandData) {
                            console.warn(`[Data Fetch] No main brand info row found for "${brandName}" (ID: ${brandId}). Skipping this brand.`);
                            return null;
                        }

                        if (tempProducts.length === 0) {
                            console.log(`[Data Fetch] Brand "${brandName}" (ID: ${brandId}) has no products. Will not be rendered.`);
                            return null;
                        }

                        shuffleArray(tempProducts);

                        brandDataMap[brandId] = {
                            allProducts: tempProducts,
                            currentProductIndex: 0,
                            brandName: brandName,
                            category: brandCategory,
                            parish: brandParish,
                            town: brandTown,
                            brandLogo: brandLogo,
                            brandColor: brandColor,
                            brandSecondaryColor: brandSecondaryColor,
                            brandImage: brandImage,
                            expiryDate: expiryDate,
                            cashbackStatus: cashbackStatus, // Store cashback status in brandDataMap
                            brandId: brandId
                        };
                        console.log(`[Data Fetch] Successfully processed brand: "${brandName}" (ID: ${brandId}), Category: "${brandCategory}", Parish: "${brandParish}", Town: "${brandTown}", Products: ${tempProducts.length}`);

                        // Hide loading overlay as soon as the first brand is successfully loaded and processed
                        if (!firstBrandLoaded) {
                            hideLoadingOverlay();
                            console.log("[Loading Overlay] Hidden after first brand loaded.");
                            firstBrandLoaded = true;
                        }

                        return brandId;
                    } catch (err) {
                        console.error(`[Data Fetch] Failed to load deals for "${brandName}" from ${sheetUrl}:`, err);
                        return null;
                    }
                });

                const loadedBrandIds = await Promise.all(brandPromises);
                const successfullyLoadedBrands = loadedBrandIds.filter(id => id !== null);
                console.log("[Data Fetch] Successfully loaded brand IDs:", successfullyLoadedBrands);


                if (successfullyLoadedBrands.length === 0) {
                    allBrandsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 py-4">No brands with products found or all failed to load.</p>';
                    console.log("[Data Fetch] No brands with products found after processing all sheets.");
                    // If no brands loaded at all, ensure overlay is hidden
                    if (!firstBrandLoaded) {
                        hideLoadingOverlay();
                        console.log("[Loading Overlay] Hidden because no brands were successfully loaded.");
                    }
                    return;
                }

                // After all data is processed and dynamicJamaicanLocations and dynamicCategories are built
                populateCategories(); // Populate categories using the dynamic data
                populateParishes(); // Populate parishes and then towns using the dynamic data

                // Fetch and render ranked slots
                await fetchAndRenderFeaturedBrands();
                // Fetch and render today's special brand (now using SpecialBrandUrl)
                await fetchAndRenderTodaysSpecialBrand();


                console.log("[Data Fetch] All brands processed. Applying filters and rendering...");
                // Now, explicitly call applyFilters to show all brands by default (since no featured brand is initially selected)
                applyFilters();

            } catch (err) {
                console.error('[Data Fetch] Failed to load master sheet:', err);
                document.getElementById('all-brands-container').innerHTML = '<p class="col-span-full text-center text-red-500 py-4">Failed to load brand list. Please check the master sheet URL.</p>';
            } finally {
                // This finally block will now only hide the overlay if no brands were loaded at all
                // or if an error occurred before any brand could trigger the hide.
                if (!firstBrandLoaded) {
                    hideLoadingOverlay();
                    console.log("[Loading Overlay] Hidden by finally block (all promises settled, first brand not loaded).");
                }
            }
        }

        /**
         * Fetches and renders the featured brands from the ranked slots sheet.
         */
        async function fetchAndRenderFeaturedBrands() {
            try {
                const res = await fetch(rankedSlotsUrl);
                const rankedBrands = await res.json();
                console.log("[Featured Brands] Ranked slots sheet loaded:", rankedBrands);

                const featuredBrandsContainer = document.getElementById('featured-brands-container');
                featuredBrandsContainer.innerHTML = ''; // Clear previous featured brands

                const now = new Date();
                const featuredBrandIds = [];

                // Filter for valid and non-expired ranked brands, limit to 5
                for (const row of rankedBrands) {
                    const brandName = row['Brand'];
                    const expiryDateStr = row['Expires At']; // Assuming this is the column name for expiry

                    if (brandName && expiryDateStr) {
                        const expiry = new Date(expiryDateStr);
                        if (expiry && now < expiry) {
                            const brandId = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                            if (brandDataMap[brandId]) { // Ensure the brand exists in our main data map
                                featuredBrandIds.push(brandId);
                                if (featuredBrandIds.length >= 5) break; // Limit to 5 featured brands
                            } else {
                                console.warn(`[Featured Brands] Ranked brand "${brandName}" (ID: ${brandId}) not found in master brand data. Skipping.`);
                            }
                        } else {
                            console.log(`[Featured Brands] Ranked brand "${brandName}" (Expires: ${expiryDateStr}) is expired or invalid. Skipping.`);
                        }
                    }
                }

                if (featuredBrandIds.length > 0) {
                    document.getElementById('featured-brands-section').classList.remove('hidden');
                    featuredBrandIds.forEach(brandId => {
                        const brand = brandDataMap[brandId];
                        if (brand) {
                            const card = createFeaturedBrandCard(brand.brandName, brand.brandLogo, brand.brandId);
                            featuredBrandsContainer.appendChild(card);
                        }
                    });

                    // Removed: Automatically select the first featured brand on load
                    // selectFeaturedBrand(featuredBrandIds[0]);
                } else {
                    document.getElementById('featured-brands-section').classList.add('hidden');
                    console.log("[Featured Brands] No valid featured brands found or all expired. Hiding section.");
                }

            } catch (err) {
                console.error('[Featured Brands] Failed to load ranked slots sheet:', err);
                document.getElementById('featured-brands-section').classList.add('hidden'); // Hide section on error
            }
        }

        /**
         * Creates an HTML card for a featured brand.
         * @param {string} brandName - The name of the brand.
         * @param {string} brandLogo - URL to the brand's logo.
         * @param {string} brandId - The unique ID for the brand.
         * @returns {HTMLElement} The created featured brand card element.
         */
        function createFeaturedBrandCard(brandName, brandLogo, brandId) {
            const card = document.createElement('div');
            card.className = 'featured-brand-card';
            card.id = `featured-card-${brandId}`; // Unique ID for each featured card
            card.setAttribute('data-brand-id', brandId);

            card.innerHTML = `
                <img src="${brandLogo}" alt="${brandName} Logo" onerror="this.onerror=null;this.src='https://placehold.co/80x80/cccccc/333333?text=Logo';">
                <p class="brand-name">${brandName}</p>
            `;

            card.addEventListener('click', () => selectFeaturedBrand(brandId));
            return card;
        }

        /**
         * Fetches data from the special brand sheet to determine and render "Today's Special Brand".
         */
        async function fetchAndRenderTodaysSpecialBrand() {
            const specialBrandSection = document.getElementById('top-special-brand-section');
            specialBrandSection.style.display = 'none'; // Explicitly hide at the start
            console.log("[Today's Special Brand] Initial state: Hiding section.");

            try {
                const res = await fetch(SpecialBrandUrl); // Using the corrected SpecialBrandUrl
                const data = await res.json();
                console.log("[Today's Special Brand] Special brand sheet data:", data);

                const todaysSpecialBrandContent = document.getElementById('todays-special-brand-content');
                todaysSpecialBrandContent.innerHTML = ''; // Clear previous content

                if (data.length === 0) {
                    console.log("[Today's Special Brand] No data in special brand sheet to determine special brand. Section remains hidden.");
                    return; // Section is already hidden, just return
                }

                const last = data[data.length - 1]; // Get the last row
                const now = new Date();
                const expiry = new Date(last['Expires At']);
                const featuredBrandName = last['Featured Brand'];

                console.log('[Today\'s Special Brand] Now:', now.toISOString());
                console.log('[Today\'s Special Brand] Expiry from sheet:', last['Expires At']);
                console.log('[Today\'s Special Brand] Parsed Expiry:', expiry.toISOString());
                console.log('[Today\'s Special Brand] Featured Brand Name:', featuredBrandName);

                const storedBrand = localStorage.getItem('selectedFavoriteBrand');
                const originalBrand = localStorage.getItem('originalBrand');

                let specialBrandIdToRender = null;

                if (now < expiry && featuredBrandName) {
                    const featuredBrandId = featuredBrandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                    if (brandDataMap[featuredBrandId]) {
                        // Logic from user's prompt for localStorage
                        if (!originalBrand && storedBrand && storedBrand !== featuredBrandName) {
                            localStorage.setItem('originalBrand', storedBrand);
                        }
                        localStorage.setItem('selectedFavoriteBrand', featuredBrandName);
                        localStorage.setItem('tempExpiryTime', expiry.getTime());
                        console.log('[Today\'s Special Brand] tempExpiryTime set to:', expiry.getTime());
                        specialBrandIdToRender = featuredBrandId;
                    } else {
                        console.warn(`[Today's Special Brand] Featured Brand "${featuredBrandName}" (ID: ${featuredBrandId}) not found in main brand data map. Skipping.`);
                        // Fallback if featured brand is not in main data
                        if (originalBrand) {
                            localStorage.setItem('selectedFavoriteBrand', originalBrand);
                            localStorage.removeItem('originalBrand');
                        }
                        localStorage.removeItem('tempExpiryTime');
                        console.log('[Today\'s Special Brand] Expired or missing brand — reset to original.');
                    }
                } else {
                    if (originalBrand) {
                        localStorage.setItem('selectedFavoriteBrand', originalBrand);
                        localStorage.removeItem('originalBrand');
                    }
                    localStorage.removeItem('tempExpiryTime');
                    console.log('[Today\'s Special Brand] Expired or missing brand — reset to original.');
                }

                if (specialBrandIdToRender && brandDataMap[specialBrandIdToRender]) {
                    currentSpecialBrandData = { ...brandDataMap[specialBrandIdToRender] }; // Copy data for independent tracking
                    currentSpecialBrandData.currentProductIndex = 0; // Reset index for this section

                    const initialProductsToDisplay = currentSpecialBrandData.allProducts.slice(0, productsPerPage);

                    renderInitialProducts(
                        currentSpecialBrandData.brandId,
                        initialProductsToDisplay,
                        todaysSpecialBrandContent,
                        true // Indicate this is for the special brand section
                    );
                    currentSpecialBrandData.currentProductIndex = initialProductsToDisplay.length; // Update index after initial render

                    specialBrandSection.style.display = 'flex'; // Show the section
                    console.log("[Today's Special Brand] Special brand found and rendered. Showing section.");
                    updateShopMoreButtonForSpecialBrand(); // Update the specific shop more button
                } else {
                    console.log("[Today's Special Brand] No valid special brand to display. Section remains hidden.");
                    specialBrandSection.style.display = 'none'; // Ensure it stays hidden
                }

            } catch (err) {
                console.error('[Today\'s Special Brand] Failed to load special brand sheet:', err);
                specialBrandSection.style.display = 'none'; // Ensure hidden on error
            }
        }

        /**
         * Selects a featured brand, highlights its card, and filters the main content.
         * @param {string} brandId - The ID of the featured brand to select.
         */
        function selectFeaturedBrand(brandId) {
            selectedFeaturedBrandId = brandId;

            // Remove active class from all featured cards
            document.querySelectorAll('.featured-brand-card').forEach(card => {
                card.classList.remove('active');
            });
            // Also remove active class from the "Today's Special Brand" card if it exists
            const todaysSpecialCard = document.querySelector('.todays-special-brand-card');
            if (todaysSpecialCard) {
                todaysSpecialCard.classList.remove('active');
            }


            // Add active class to the selected card (either featured or today's special)
            const activeCard = document.getElementById(`featured-card-${brandId}`); // Only featured cards respond to this now
            if (activeCard) {
                activeCard.classList.add('active');
            }

            // Clear other filter inputs when a featured brand is selected
            brandSearchInput.value = '';
            parishSelect.value = 'All Parishes';
            townSelect.value = 'All Towns';
            sessionStorage.setItem('selectedCategory', 'all');
            highlightCategory(document.querySelector('.category-item[data-filter-value="all"]'));


            applyFilters(); // Apply filters based on the selected featured brand
        }


        /**
         * Applies all active filters (search term, category, parish, town, or featured brand) and updates the displayed brand sections.
         */
        function applyFilters() {
            const allBrandsContainer = document.getElementById('all-brands-container');
            allBrandsContainer.innerHTML = ''; // Clear existing content before re-rendering filtered results

            let tempFilteredBrandIds = []; // Use a temporary array for filtering

            if (selectedFeaturedBrandId) {
                // If a featured brand is selected, only show that brand
                if (brandDataMap[selectedFeaturedBrandId]) {
                    tempFilteredBrandIds.push(selectedFeaturedBrandId);
                } else {
                    console.warn(`[Filter] Selected featured brand (ID: ${selectedFeaturedBrandId}) not found in brandDataMap.`);
                }
            } else {
                // If no featured brand is selected, apply normal filters
                const searchTerm = brandSearchInput.value.toLowerCase().trim();
                const selectedParish = parishSelect.value.toLowerCase().trim();
                const selectedTown = townSelect.value.toLowerCase().trim();
                const selectedCategory = sessionStorage.getItem('selectedCategory') || 'all';

                console.log(`[Filter] Applying filters: Search="${searchTerm}", Category="${selectedCategory}", Parish="${selectedParish}", Town="${selectedTown}"`);

                for (const brandId in brandDataMap) {
                    const brand = brandDataMap[brandId];

                    // Skip rendering the special brand in the regular section
                    if (currentSpecialBrandData && brandId === currentSpecialBrandData.brandId) {
                        console.log(`[Filter] Skipping special brand "${brand.brandName}" (ID: ${brandId}) in regular listing.`);
                        continue;
                    }

                    let matchesSearch = true;
                    if (searchTerm !== '') {
                        matchesSearch = brand.brandName.toLowerCase().includes(searchTerm) ||
                                         brand.allProducts.some(p => (p.ProductName || '').toLowerCase().includes(searchTerm));
                    }

                    let matchesCategory = true;
                    if (selectedCategory !== 'all') {
                        matchesCategory = (brand.category || '').toLowerCase() === selectedCategory;
                    }

                    let matchesParish = true;
                    if (selectedParish !== '' && selectedParish !== 'all parishes') {
                        matchesParish = (brand.parish || '').toLowerCase() === selectedParish;
                    }

                    let matchesTown = true;
                    if (selectedTown !== '' && selectedTown !== 'all towns') {
                        matchesTown = (brand.town || '').toLowerCase() === selectedTown;
                    }

                    const shouldShow = matchesSearch && matchesCategory && matchesParish && matchesTown;

                    if (shouldShow) {
                        tempFilteredBrandIds.push(brandId);
                    }
                }
            }

            // Update the global filteredBrandIds array and reset main index and auto-load count
            filteredBrandIds = tempFilteredBrandIds;
            currentMainBrandIndex = 0;
            autoLoadCount = 0;

            // Render the initial batch of filtered brands
            renderNextBatchOfBrands();

            // Setup Intersection Observer for auto-loading
            setupIntersectionObserver();

            // Ensure the manual load button is hidden initially
            document.getElementById('shop-more-container-main').classList.add('hidden');

            let noResultsMessage = document.getElementById('no-results-message');

            if (filteredBrandIds.length === 0) {
                if (!noResultsMessage) {
                    noResultsMessage = document.createElement('p');
                    noResultsMessage.id = 'no-results-message';
                    noResultsMessage.className = 'col-span-full text-center text-gray-500 py-8 text-xl';
                    allBrandsContainer.appendChild(noResultsMessage);
                }
                noResultsMessage.textContent = `No brands or deals found matching your filters.`;
                console.log("[Filter] No content found after applying filters.");
            } else if (noResultsMessage) {
                noResultsMessage.remove();
                console.log("[Filter] Content found, removing 'no results' message.");
            }
        }

        /**
         * Renders the next batch of brands for the main list based on current filters.
         */
        function renderNextBatchOfBrands() {
            const brandsToRender = filteredBrandIds.slice(currentMainBrandIndex, currentMainBrandIndex + brandsPerPage);
            const allBrandsContainer = document.getElementById('all-brands-container');

            brandsToRender.forEach(brandId => {
                const brand = brandDataMap[brandId];
                if (brand) {
                    renderBrandSection(
                        brand.brandName,
                        brand.brandId,
                        brand.brandLogo,
                        brand.brandColor,
                        brand.brandImage,
                        brand.category,
                        brand.parish,
                        brand.town,
                        brand.expiryDate,
                        brand.brandSecondaryColor,
                        brand.cashbackStatus
                    );
                }
            });

            currentMainBrandIndex += brandsToRender.length;
            updateLoadMoreMainButton(); // Update button visibility and observer state
        }

        /**
         * Loads more brands for the main list when the button is clicked.
         */
        function loadMoreBrands() {
            renderNextBatchOfBrands();
        }

        /**
         * Updates the visibility and text of the main "Load More" button.
         */
        function updateLoadMoreMainButton() {
            const shopMoreButtonSpan = document.getElementById(`shop-more-count-main`);
            const shopMoreButtonContainer = document.getElementById(`shop-more-container-main`);

            if (!shopMoreButtonSpan || !shopMoreButtonContainer) return;

            const remainingCount = filteredBrandIds.length - currentMainBrandIndex;

            if (remainingCount > 0) {
                if (autoLoadCount < maxAutoLoads) {
                    // Still in auto-load phase, hide button
                    shopMoreButtonContainer.classList.add('hidden');
                    // Ensure observer is active if there are still brands to load automatically
                    if (intersectionObserver && document.getElementById('load-more-sentinel')) {
                        intersectionObserver.unobserve(document.getElementById('load-more-sentinel')); // Disconnect to re-observe if needed
                        intersectionObserver.observe(document.getElementById('load-more-sentinel'));
                    }
                } else {
                    // Auto-loads exhausted, show button
                    shopMoreButtonSpan.textContent = `View ${remainingCount} More Brands`;
                    shopMoreButtonContainer.classList.remove('hidden');
                    if (intersectionObserver) {
                        intersectionObserver.disconnect(); // Disconnect observer when manual button appears
                    }
                }
            } else {
                // No more brands to load, hide button and disconnect observer
                shopMoreButtonContainer.classList.add('hidden');
                if (intersectionObserver) {
                    intersectionObserver.disconnect();
                }
            }
        }

        /**
         * Sets up the Intersection Observer for automatic loading of main brands.
         */
        function setupIntersectionObserver() {
            if (intersectionObserver) {
                intersectionObserver.disconnect(); // Disconnect existing observer
            }

            const loadMoreSentinel = document.getElementById('load-more-sentinel');
            if (!loadMoreSentinel) {
                console.warn("Load more sentinel element not found.");
                return;
            }

            intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const remainingCount = filteredBrandIds.length - currentMainBrandIndex;
                        if (autoLoadCount < maxAutoLoads && remainingCount > 0) {
                            autoLoadCount++;
                            console.log(`[Auto-Load] Auto-loading batch ${autoLoadCount}/${maxAutoLoads}`);
                            renderNextBatchOfBrands();
                        } else if (remainingCount === 0) {
                            // No more brands, disconnect observer
                            if (intersectionObserver) {
                                intersectionObserver.disconnect();
                            }
                            console.log("[Auto-Load] All brands loaded, observer disconnected.");
                        } else {
                            // Auto-loads exhausted, show manual button if more brands exist
                            if (remainingCount > 0) {
                                updateLoadMoreMainButton(); // This will show the manual button
                            }
                            if (intersectionObserver) {
                                intersectionObserver.disconnect();
                            }
                            console.log("[Auto-Load] Max auto-loads reached, observer disconnected.");
                        }
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '0px',
                threshold: 0.1 // Trigger when 10% of the sentinel is visible
            });

            intersectionObserver.observe(loadMoreSentinel);
            console.log("[IntersectionObserver] Observer setup and observing sentinel.");
        }


        /**
         * Creates a category item for the floating bar.
         * @param {string} categoryName - The name of the category.
         * @returns {HTMLElement} The created category item element.
         */
        function createFloatingCategoryItem(categoryName) {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.setAttribute('data-filter-type', 'category');
            categoryItem.setAttribute('data-filter-value', categoryName.toLowerCase());

            categoryItem.innerHTML = `
                <span class="category-name">${categoryName}</span>
            `;
            categoryItem.addEventListener('click', () => {
                sessionStorage.setItem('selectedCategory', categoryName.toLowerCase()); // Save selected category
                highlightCategory(categoryItem);
                selectedFeaturedBrandId = null; // Clear featured brand selection
                applyFilters(); // Apply filters
            });
            return categoryItem;
        }

        /**
         * Highlights the active category item in the floating bar.
         * @param {HTMLElement} activeItem - The category item to highlight.
         */
        function highlightCategory(activeItem) {
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });
            activeItem.classList.add('active');
        }

        /**
         * Populates the categories in the floating bar.
         */
        function populateCategories() {
            const categoriesList = document.getElementById('categories-list');
            // Clear existing categories before re-populating to prevent duplicates
            categoriesList.innerHTML = '';

            // Get the currently selected category from session storage, default to 'all'
            const currentSelectedCategory = sessionStorage.getItem('selectedCategory') || 'all';

            // Add "All Categories" as the first item
            const allCategoriesItem = document.createElement('div');
            allCategoriesItem.className = 'category-item';
            allCategoriesItem.setAttribute('data-filter-type', 'category');
            allCategoriesItem.setAttribute('data-filter-value', 'all');
            allCategoriesItem.innerHTML = `<span class="category-name">All Categories</span>`;
            categoriesList.appendChild(allCategoriesItem);

            allCategoriesItem.addEventListener('click', () => {
                sessionStorage.setItem('selectedCategory', 'all'); // Save selected category
                highlightCategory(allCategoriesItem);
                selectedFeaturedBrandId = null; // Clear featured brand selection
                applyFilters(); // Apply filters
            });

            // Populate floating categories from the dynamically collected list
            const sortedCategories = Array.from(dynamicCategories).sort(); // Convert Set to Array and sort
            sortedCategories.forEach(category => {
                const categoryItem = createFloatingCategoryItem(category);
                categoriesList.appendChild(categoryItem);
            });

            // After all categories are added, highlight the one that was selected
            const activeItem = categoriesList.querySelector(`[data-filter-value="${currentSelectedCategory}"]`);
            if (activeItem) {
                highlightCategory(activeItem);
            } else {
                // If the previously selected category is no longer available, default to "All Categories"
                highlightCategory(allCategoriesItem);
                sessionStorage.setItem('selectedCategory', 'all');
            }
        }

        /**
         * Populates the parish dropdown with options from dynamicJamaicanLocations.
         */
        function populateParishes() {
            const parishSelect = document.getElementById('parishSelect');
            parishSelect.innerHTML = ''; // Clear existing options

            // Always add "All Parishes" first
            const allParishesOption = document.createElement('option');
            allParishesOption.value = "All Parishes";
            allParishesOption.textContent = "All Parishes";
            parishSelect.appendChild(allParishesOption);

            // Add parishes from dynamic data, ensuring unique and sorted order (optional)
            const sortedParishes = Object.keys(dynamicJamaicanLocations)
                                        .filter(p => p !== "All Parishes")
                                        .sort();
            sortedParishes.forEach(parish => {
                const option = document.createElement('option');
                option.value = parish;
                option.textContent = parish;
                parishSelect.appendChild(option);
            });

            // Restore previous selection or set default
            if (sessionStorage.getItem('selectedParish')) {
                parishSelect.value = sessionStorage.getItem('selectedParish');
            } else {
                parishSelect.value = "All Parishes";
            }
            populateTowns(parishSelect.value); // Populate towns for the initial parish
        }

        /**
         * Populates the town dropdown based on the selected parish.
         * @param {string} selectedParish - The currently selected parish.
         */
        function populateTowns(selectedParish) {
            const townSelect = document.getElementById('townSelect');
            townSelect.innerHTML = ''; // Clear existing options

            const towns = dynamicJamaicanLocations[selectedParish] || ["All Towns"];

            // Always add "All Towns" first for the selected parish
            const allTownsOption = document.createElement('option');
            allTownsOption.value = "All Towns";
            allTownsOption.textContent = "All Towns";
            townSelect.appendChild(allTownsOption);

            // Add other towns, ensuring unique and sorted order (optional)
            const sortedTowns = towns.filter(t => t !== "All Towns").sort();
            sortedTowns.forEach(town => {
                const option = document.createElement('option');
                option.value = town;
                option.textContent = town;
                townSelect.appendChild(option);
            });

            // Restore previous selection or set default
            if (sessionStorage.getItem('selectedTown') && dynamicJamaicanLocations[selectedParish]?.includes(sessionStorage.getItem('selectedTown'))) {
                townSelect.value = sessionStorage.getItem('selectedTown');
            } else {
                townSelect.value = "All Towns";
            }
        }


        // Event listener for Brand Search Input (with debounce)
        const brandSearchInput = document.getElementById('brandSearchInput');
        let searchTimeout;
        brandSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                selectedFeaturedBrandId = null; // Clear featured brand selection
                // Reset category/parish/town selections if search is used
                sessionStorage.setItem('selectedCategory', 'all');
                highlightCategory(document.querySelector('.category-item[data-filter-value="all"]'));
                parishSelect.value = 'All Parishes';
                townSelect.value = 'All Towns';

                applyFilters(); // Apply filters
            }, 300); // Debounce for 300ms
        });

        // Event listener for Parish Dropdown
        const parishSelect = document.getElementById('parishSelect');
        parishSelect.addEventListener('change', () => {
            sessionStorage.setItem('selectedParish', parishSelect.value); // Save selected parish
            sessionStorage.removeItem('selectedTown'); // Clear town when parish changes
            populateTowns(parishSelect.value); // Update towns based on selected parish
            selectedFeaturedBrandId = null; // Clear featured brand selection
            applyFilters(); // Apply filters
        });

        // Event listener for Town Dropdown
        const townSelect = document.getElementById('townSelect');
        townSelect.addEventListener('change', () => {
            sessionStorage.setItem('selectedTown', townSelect.value); // Save selected town
            selectedFeaturedBrandId = null; // Clear featured brand selection
            applyFilters(); // Apply filters
        });

        // Initial fetch and render on page load
        document.addEventListener('DOMContentLoaded', () => {
            fetchAndProcessData(); // Fetch and process all brand data, which will then populate locations and categories and apply filters
        });

        // Close popup when clicking outside the content
        document.getElementById('popup').addEventListener('click', function (e) {
            if (e.target === this) {
                closePopup();
            }
        });
