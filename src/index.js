const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImJjYzczN2FhOGMyMTIyZGQ3NTIwZWZiYjM4M2U0NjZkZjE5ZTlhYTM2ZGU3YWRiMDdhOTYzNjJlZGQ3OWUwZjZjYTRhMzBlNjZiNzk1MmVhIn0.eyJhdWQiOiJhMWRlYjY2Ni04M2FiLTQ3NzctYTEyNC0zNzgwZTFmOWM0ZmMiLCJqdGkiOiJiY2M3MzdhYThjMjEyMmRkNzUyMGVmYmIzODNlNDY2ZGYxOWU5YWEzNmRlN2FkYjA3YTk2MzYyZWRkNzllMGY2Y2E0YTMwZTY2Yjc5NTJlYSIsImlhdCI6MTcyNzg3NzQ3MywibmJmIjoxNzI3ODc3NDczLCJleHAiOjE4MzAyOTc2MDAsInN1YiI6IjExNTk1NDE4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTg0OTQyLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiM2RjZjE1NjYtNmFlMS00MTc0LWJhYjgtMGJiOTBiNTRhNDUzIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.GP5nipYlR2E0oU8FrrmRNDeJXhecCmkCY6XnWAP7Xs9qp5oZVgQ0IDu_fxkNflgcsacSfKczWOk9mAG4YtOYR8G4SlEHhpnU4D6ncAvn5FRhDBB9dCqi7iCzCOHQlGnYkjMeLYpIWBcZnRUe0L7PPpskwGn5U8mQ93iHClbz897XW5A9HL-l8SeMG_uLUAs9jLa-zfR_gBM3AQCtmc_NvGic5HxDXAFZgj2t7PxXXABj7Sc1rUGoRz3J5F-7l3DBIPKa3i2fST_HrA48olNkvuR9ZWVmDzwwBQ92DGebqG1di2JFQLf9GLTA4jHcgWmS6Mih--Nw3YA6VN674P1nsQ';
const table = document.querySelector('tbody');
let page = 1;
const limit = 3;
let hasNextPage = true;
let response = null;
let lastOpenedDeal = null;

const fetchDeals = async (page, limit) => {
  try {
    if (hasNextPage) {
      response = await fetch(`https://dmitriyluff.amocrm.ru/api/v4/leads?limit=${limit}&page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      return [];
    }
    const data = await response.json();
    if (!data._links.next) {
      hasNextPage = false;
    }
    return data._embedded.leads;
  } catch (error) {
    console.error('deals request error:', error);
    return [];
  }
};

const fetchDealDetails = async (dealId) => {
  try {
    const response = await fetch(`https://dmitriyluff.amocrm.ru/api/v4/leads/${dealId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('deal request error:', error);
      return null;
  }
};

const renderDeals = (deals) => {
  deals.forEach(deal => {
    const currentDeal = document.createElement('tr');
    currentDeal.setAttribute('data-id', deal.id);
    currentDeal.innerHTML = renderCard(deal, false);
    currentDeal.addEventListener('click', () => handleDealClick(deal, currentDeal));
    table.appendChild(currentDeal);
  });
};

const renderCard = (deal, isOpened) => {
  if (isOpened) {
    return `
      <td colspan="3">
        <div class="deal-card">
          <h2>${deal.name}</h2>
          <div class="deal-details">
            <div>
              <b>id:</b> ${deal.id}
            </div>
            <div>
              <b>дата:</b> ${formatDate(deal.created_at * 1000)}
            </div>
            <div class="deal-status"><b>статус:</b> 
              <svg viewBox="0 0 20 20" width="20" height="20">
                <circle cx="10" cy="10" r="10" fill="${getTaskStatus(deal.closest_task_at)}" />
              </svg>
            </div>
          </div>
        </div>
      </td>
    `;
  }
  return `
    <td>${deal.id}</td>
    <td>${deal.name}</td>
    <td>${deal.price}</td>
  `;
}

const handleDealClick = async (deal, element) => {
  if (element.classList.contains('opened')) {
    element.classList.remove('opened');
    element.innerHTML = renderCard(deal, false);
    return;
  } 
  element.classList.add('opened');
  element.innerHTML = `<td colspan="3"><div class="spinner"></div></td>`;
  if (lastOpenedDeal && lastOpenedDeal.id !== deal.id) {
    const lastOpenedRow = document.querySelector(`tr[data-id="${lastOpenedDeal.id}"]`);
    lastOpenedRow.classList.remove('opened');
    lastOpenedRow.innerHTML = renderCard(lastOpenedDeal, false);
  }
  const dealDetails = await fetchDealDetails(deal.id);
  lastOpenedDeal = deal;
  if (dealDetails) {
    element.innerHTML = renderCard(dealDetails, true);
  }
};

const getTaskStatus = (closestTaskAt) => {
  if (!closestTaskAt) {
    return 'red';
  }
  const taskDate = new Date(closestTaskAt * 1000);
  const currentDate = new Date();

  if (taskDate < currentDate.setHours(0, 0, 0, 0)) {
    return 'red';
  } 
  else if (taskDate.toDateString() === currentDate.toDateString()) {
    return 'green';
  }
  return 'yellow';
};

const formatDate = (rawDate) => {
  const date = new Date(rawDate);
  return date.toLocaleDateString('ru-RU');
};

const loadDeals = () => {
  const intervalId = setInterval(async () => {
    const deals = await fetchDeals(page, limit); 

    if (deals.length > 0) {
      renderDeals(deals);
      page += 1;
    }
    else {
      clearInterval(intervalId);
    }
  }, 1000);
};

loadDeals();
