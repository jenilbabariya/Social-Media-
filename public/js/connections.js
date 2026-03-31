document.addEventListener('DOMContentLoaded', () => {
    const connectionsList = document.getElementById('connections-list');
    const limitSelect = document.getElementById('limit-select');
    const pageButtons = document.getElementById('page-buttons');
    const tabs = document.querySelectorAll('.tab');
    const typeInput = document.getElementById('connection-type');

    const updateConnections = async (type, page, limit) => {
        try {
            const container = document.querySelector('.connections-container');
            container.classList.add('loading');

            const userId = window.CONNECTIONS_USER_ID;
            const url = `/profile/${userId}/connections?type=${type}&page=${page}&limit=${limit}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.flag === 1) {
                const data = result.data;
                renderUsers(data.users, data.type);
                renderPagination(data.page, data.totalPages, data.type, data.limit);

                typeInput.value = data.type;
                updateTabs(data.type);
            }
        } catch (error) {
            // Error handling
        } finally {
            document.querySelector('.connections-container').classList.remove('loading');
        }
    };

    const renderUsers = (users, type) => {
        if (users.length === 0) {
            connectionsList.innerHTML = `
                <div class="empty">
                    <i class="bi bi-people" style="font-size: 40px; color: var(--bs-primary);"></i>
                    <p class="mt-2">No ${type} yet</p>
                </div>
            `;
            return;
        }

        connectionsList.innerHTML = users.map(person => `
            <a href="/profile/${person.username}" class="user-card text-decoration-none">
                <img src="${person.profilePicture || '/images/default-avatar.png'}" alt="${person.username}" />
                <div>
                    <p class="mb-0 fw-semibold text-dark">${person.username}</p>
                </div>
            </a>
        `).join('');
    };

    const renderPagination = (page, totalPages, type, limit) => {
        let html = '';
        if (page > 1) {
            html += `<a href="?type=${type}&page=${page - 1}&limit=${limit}" class="btn btn-primary-custom" data-page="${page - 1}">Prev</a>`;
        }
        if (page < totalPages) {
            html += `<a href="?type=${type}&page=${page + 1}&limit=${limit}" class="btn btn-primary-custom" data-page="${page + 1}">Next</a>`;
        }
        pageButtons.innerHTML = html;
    };

    const updateTabs = (type) => {
        tabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    };

    // Event Listeners
    limitSelect.addEventListener('change', () => {
        updateConnections(typeInput.value, 1, limitSelect.value);
    });

    pageButtons.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = e.target.dataset.page;
            updateConnections(typeInput.value, page, limitSelect.value);
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const type = tab.dataset.type;
            updateConnections(type, 1, limitSelect.value);
        });
    });
});
