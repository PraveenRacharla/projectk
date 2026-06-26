// JavaScript file
const API_URL = "https://projectk-zydp.onrender.com";

async function loadExpenses() {
  const res = await fetch("https://projectk-zydp.onrender.com/expenses");
  const data = await res.json();

  console.log(data);

  // TOTAL
  const total = data.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById("total").innerText = total + " NOK";

  // GROUP BY CATEGORY
  const map = {};
  data.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });

  // PIE CHART
  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map)
      }]
    }
  });
}

loadExpenses();
