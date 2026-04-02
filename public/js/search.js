const searchInput = document.getElementById('userSearchInput');
const resultsContainer = document.getElementById('searchResults');
const exploreGrid = document.getElementById('exploreGrid');
let debounceTimer;

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (!query) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            if (exploreGrid) exploreGrid.style.display = 'block';
            return;
        }

        // Hide explore grid and show results container
        if (exploreGrid) exploreGrid.style.display = 'none';
        resultsContainer.style.display = 'block';

        debounceTimer = setTimeout(() => {
            fetchUsers(query);
        }, 300);
    });
}

async function fetchUsers(query) {
    try {
        resultsContainer.innerHTML = `
            <div class="text-center mt-5">
                <div class="spinner-border text-primary spinner-border-sm" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.flag === 1) {
            renderResults(data.data);
        } else {
            resultsContainer.innerHTML = '<p class="text-center text-danger mt-5">Error fetching results</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p class="text-center text-danger mt-5">An error occurred</p>';
    }
}

function renderResults(users) {
    if (users.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-muted mt-5">
                <p>No users found matching "${searchInput.value}"</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = users.map(user => `
        <a href="/profile/${user.username}" class="result-item">
            <div class="avatar-wrapper">
                ${user.profilePicture 
                    ? `<img src="${user.profilePicture}" alt="${user.username}">`
                    : `<img src="https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff" alt="${user.username}">`
                }
            </div>
            <div class="user-info">
                <span class="username">${user.username}</span>
                <span class="fullname">${user.fullname}</span>
            </div>
        </a>
    `).join('');
}
