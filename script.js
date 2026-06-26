// JavaScript file
async function loadExpenses() {
  const res = await fetch("http://127.0.0.1:5000/expenses");
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

async function addExpense() {
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;
  const note = document.getElementById("note").value;

  if (!date || !category || !amount) {
    alert("Please fill required fields");
    return;
  }

  const res = await fetch(API_URL + "/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      date,
      category,
      amount,
      note
    })
  });

  if (res.ok) {
    alert("Expense added!");

    // refresh dashboard
    loadExpenses();

    // clear form
    document.getElementById("date").value = "";
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";
  } else {
    alert("Error adding expense");
  }
}

loadExpenses();
