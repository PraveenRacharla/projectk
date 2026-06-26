const API_URL = "https://YOUR-RENDER-APP.onrender.com";

async function loadExpenses() {
  const res = await fetch(`${API_URL}/expenses`);
  const data = await res.json();

  console.log(data);

  const total = data.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById("total").innerText = total + " NOK";

  const map = {};
  data.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });

  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map)
      }]
    }
  });

  const list = document.getElementById("list");
  list.innerHTML = "";

  Object.entries(map).forEach(([cat, val]) => {
  const li = document.createElement("li");
  li.innerText = `${cat}: ${val} NOK`;
  list.appendChild(li);
  });
}

loadExpenses();
