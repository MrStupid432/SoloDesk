(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = "solodesk_demo_v1";
  let state = { jobs: [], tasks: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.jobs) && Array.isArray(saved.tasks)) state = saved;
  } catch (_) {}

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);

  const formatMoney = amount => new Intl.NumberFormat("en-AU", {
    style:"currency", currency:"AUD"
  }).format(amount);

  const makeId = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("notice").textContent = "Saved on this device.";
    } catch (_) {
      $("notice").textContent = "This browser could not save your changes.";
    }
  }

  function render() {
    const completed = state.jobs.filter(job => job.done);
    $("earned").textContent = formatMoney(completed.reduce((sum, job) => sum + job.price, 0));
    $("openJobs").textContent = state.jobs.filter(job => !job.done).length;
    $("tasksLeft").textContent = state.tasks.filter(task => !task.done).length;

    $("jobsList").classList.toggle("empty", state.jobs.length === 0);
    $("jobsList").innerHTML = state.jobs.length ? state.jobs.map(job => `
      <div class="job-row">
        <div class="job-info">
          <div class="job-title">${escapeHTML(job.name)}</div>
          <div class="job-meta">${escapeHTML(job.service || "General job")} · ${job.due ? "Due " + escapeHTML(new Date(job.due + "T12:00:00").toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})) : "No due date"}</div>
          <span class="status ${job.done ? "done" : ""}">${job.done ? "Completed" : "Open"}</span>
        </div>
        <div class="job-price">${formatMoney(job.price)}</div>
        <button class="small-button" data-toggle-job="${escapeHTML(job.id)}">${job.done ? "Undo" : "Complete"}</button>
        <button class="delete" data-delete-job="${escapeHTML(job.id)}" aria-label="Delete job">×</button>
      </div>`).join("") : "No jobs yet. Add your first job to get started.";

    $("tasksList").classList.toggle("empty", state.tasks.length === 0);
    $("tasksList").innerHTML = state.tasks.length ? state.tasks.map(task => `
      <div class="task-row ${task.done ? "done" : ""}">
        <input type="checkbox" data-toggle-task="${escapeHTML(task.id)}" ${task.done ? "checked" : ""} aria-label="Complete task">
        <span>${escapeHTML(task.text)}</span>
        <button class="delete" data-delete-task="${escapeHTML(task.id)}" aria-label="Delete task">×</button>
      </div>`).join("") : "No tasks yet. Add a task to make a start.";
  }

  $("today").textContent = new Date().toLocaleDateString("en-AU", {
    weekday:"long", day:"numeric", month:"long"
  });

  $("showJobForm").addEventListener("click", () => {
    $("jobForm").classList.remove("hidden");
    $("jobName").focus();
  });
  $("cancelJob").addEventListener("click", () => $("jobForm").classList.add("hidden"));

  $("jobForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("jobName").value.trim();
    const price = Number($("jobPrice").value);
    if (!name || !Number.isFinite(price) || price < 0) return;
    state.jobs.unshift({
      id:makeId(), name, service:$("jobService").value.trim(),
      price, due:$("jobDate").value, done:false
    });
    event.target.reset();
    $("jobForm").classList.add("hidden");
    save(); render();
  });

  $("jobsList").addEventListener("click", event => {
    const toggle = event.target.closest("[data-toggle-job]");
    const remove = event.target.closest("[data-delete-job]");
    if (toggle) {
      const job = state.jobs.find(item => item.id === toggle.dataset.toggleJob);
      if (job) job.done = !job.done;
      save(); render();
    }
    if (remove && window.confirm("Delete this job?")) {
      state.jobs = state.jobs.filter(item => item.id !== remove.dataset.deleteJob);
      save(); render();
    }
  });

  $("taskForm").addEventListener("submit", event => {
    event.preventDefault();
    const text = $("taskText").value.trim();
    if (!text) return;
    state.tasks.push({ id:makeId(), text, done:false });
    $("taskText").value = "";
    save(); render();
  });

  $("tasksList").addEventListener("change", event => {
    const checkbox = event.target.closest("[data-toggle-task]");
    if (!checkbox) return;
    const task = state.tasks.find(item => item.id === checkbox.dataset.toggleTask);
    if (task) task.done = checkbox.checked;
    save(); render();
  });

  $("tasksList").addEventListener("click", event => {
    const remove = event.target.closest("[data-delete-task]");
    if (!remove) return;
    state.tasks = state.tasks.filter(item => item.id !== remove.dataset.deleteTask);
    save(); render();
  });

  render();
})();
