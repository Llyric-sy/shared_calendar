const STORAGE_KEY = "shared_calendar_items_v2";

const templates = {
  "date-night": {
    title: "Date night",
    duration: 240
  },

  "day-date": {
    title: "Day date",
    duration: 360
  },

  "reading-night": {
    title: "Reading night",
    duration: 90
  },

  "game-night": {
    title: "Game night",
    duration: 180
  },

  "friends-game-night": {
    title: "Game night with friends",
    duration: 240
  },

  "movie-night": {
    title: "Movie night",
    duration: 150
  },

  dinner: {
    title: "Dinner",
    duration: 120
  },

  custom: {
    title: "Custom event",
    duration: 60
  }
};

const state = {
  currentDate: new Date(),
  selectedDate: null,
  editingId: null,
  items: loadItems()
};

/* Monthly calendar */

const monthLabel = document.querySelector("#monthLabel");
const calendarDays = document.querySelector("#calendarDays");

const previousMonthButton =
  document.querySelector("#previousMonth");

const nextMonthButton =
  document.querySelector("#nextMonth");

const todayButton =
  document.querySelector("#todayButton");

/* Daily schedule */

const dayModal = document.querySelector("#dayModal");
const dayTitle = document.querySelector("#dayTitle");
const timeline = document.querySelector("#timeline");

const closeDayModalButton =
  document.querySelector("#closeDayModal");

const addScheduleButton =
  document.querySelector("#addScheduleButton");

/* Editor */

const eventModal = document.querySelector("#eventModal");
const eventForm = document.querySelector("#eventForm");

const editorLabel =
  document.querySelector("#editorLabel");

const editorHeading =
  document.querySelector("#editorHeading");

const closeEventModalButton =
  document.querySelector("#closeEventModal");

const cancelEditorButton =
  document.querySelector("#cancelEditor");

const deleteEventButton =
  document.querySelector("#deleteEvent");

const saveEventButton =
  document.querySelector("#saveEventButton");

const formMessage =
  document.querySelector("#formMessage");

const itemTypeInput =
  document.querySelector("#itemType");

const planFields =
  document.querySelector("#planFields");

const scheduleFields =
  document.querySelector("#scheduleFields");

const templateSelect =
  document.querySelector("#templateSelect");

const scheduleTypeSelect =
  document.querySelector("#scheduleType");

const eventDateInput =
  document.querySelector("#eventDate");

const startTimeSelect =
  document.querySelector("#startTime");

const endTimeSelect =
  document.querySelector("#endTime");

const notesInput =
  document.querySelector("#eventNotes");

/* Start */

buildTimeOptions();
renderCalendar();

/* Month navigation */

previousMonthButton.addEventListener("click", () => {
  state.currentDate = new Date(
    state.currentDate.getFullYear(),
    state.currentDate.getMonth() - 1,
    1
  );

  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  state.currentDate = new Date(
    state.currentDate.getFullYear(),
    state.currentDate.getMonth() + 1,
    1
  );

  renderCalendar();
});

todayButton.addEventListener("click", () => {
  state.currentDate = new Date();
  renderCalendar();
});

/* Daily schedule controls */

closeDayModalButton.addEventListener(
  "click",
  closeDayView
);

addScheduleButton.addEventListener("click", () => {
  openEditor({
    type: "schedule",
    start: "09:00",
    end: "17:00"
  });
});

/* Editor controls */

closeEventModalButton.addEventListener(
  "click",
  closeEditor
);

cancelEditorButton.addEventListener(
  "click",
  closeEditor
);

deleteEventButton.addEventListener(
  "click",
  deleteCurrentItem
);

templateSelect.addEventListener(
  "change",
  applyTemplateDuration
);

eventForm.addEventListener(
  "submit",
  saveItem
);

/* Close modal using backdrop */

dayModal.addEventListener("click", (event) => {
  if (event.target === dayModal) {
    closeDayView();
  }
});

eventModal.addEventListener("click", (event) => {
  if (event.target === eventModal) {
    closeEditor();
  }
});

/* Close modal using Escape */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!eventModal.classList.contains("hidden")) {
    closeEditor();
    return;
  }

  if (!dayModal.classList.contains("hidden")) {
    closeDayView();
  }
});

/* Render monthly calendar */

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  monthLabel.textContent =
    new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric"
    }).format(new Date(year, month, 1));

  calendarDays.innerHTML = "";

  const firstWeekday =
    new Date(year, month, 1).getDay();

  const mondayFirstOffset =
    (firstWeekday + 6) % 7;

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const totalCells = Math.max(
    35,
    Math.ceil(
      (mondayFirstOffset + daysInMonth) / 7
    ) * 7
  );

  const todayKey = toDateKey(new Date());

  for (
    let cellIndex = 0;
    cellIndex < totalCells;
    cellIndex += 1
  ) {
    const dayNumber =
      cellIndex - mondayFirstOffset + 1;

    if (
      dayNumber < 1 ||
      dayNumber > daysInMonth
    ) {
      const blankCell =
        document.createElement("div");

      blankCell.className =
        "day-cell blank-day";

      calendarDays.append(blankCell);
      continue;
    }

    const dateKey = makeDateKey(
      year,
      month,
      dayNumber
    );

    const dayButton =
      document.createElement("button");

    dayButton.type = "button";
    dayButton.className = "day-cell";

    dayButton.setAttribute(
      "aria-label",
      formatDateLong(dateKey)
    );

    if (dateKey === todayKey) {
      dayButton.classList.add("today");
    }

    const number =
      document.createElement("span");

    number.className = "day-number";
    number.textContent = String(dayNumber);

    dayButton.append(number);

    const summary =
      document.createElement("span");

    summary.className = "day-summary";

    const dayItems =
      getItemsForDate(dateKey);

    const visibleItems =
      dayItems.slice(0, 3);

    visibleItems.forEach((item) => {
      const entry =
        document.createElement("span");

      entry.className =
        `summary-entry ${item.type} ${item.category}`;

      entry.textContent =
        `${item.start} ${item.title}`;

      summary.append(entry);
    });

    const remainingCount =
      dayItems.length - visibleItems.length;

    if (remainingCount > 0) {
      const more =
        document.createElement("span");

      more.className = "more-entry";
      more.textContent =
        `+${remainingCount} more`;

      summary.append(more);
    }

    dayButton.append(summary);

    dayButton.addEventListener("click", () => {
      openDayView(dateKey);
    });

    calendarDays.append(dayButton);
  }
}

/* Open daily schedule */

function openDayView(dateKey) {
  state.selectedDate = dateKey;

  dayTitle.textContent =
    formatDateLong(dateKey);

  renderTimeline();

  dayModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeDayView() {
  dayModal.classList.add("hidden");

  if (
    eventModal.classList.contains("hidden")
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}

/* Render daily timeline */

function renderTimeline() {
  timeline.innerHTML = "";

  for (
    let slotIndex = 0;
    slotIndex < 48;
    slotIndex += 1
  ) {
    const label =
      document.createElement("div");

    label.className = "time-label";
    label.style.gridRow =
      String(slotIndex + 1);

    label.style.gridColumn = "1";

    if (slotIndex % 2 === 0) {
      label.textContent =
        indexToTime(slotIndex);
    }

    timeline.append(label);

    const slot =
      document.createElement("button");

    slot.type = "button";

    slot.className =
      slotIndex % 2 === 0
        ? "time-slot whole-hour"
        : "time-slot half-hour";

    slot.style.gridRow =
      String(slotIndex + 1);

    slot.style.gridColumn = "2";

    const slotTime =
      indexToTime(slotIndex);

    slot.setAttribute(
      "aria-label",
      `Create a plan at ${slotTime}`
    );

    slot.title =
      `Create a plan at ${slotTime}`;

    slot.addEventListener("click", () => {
      const startMinutes =
        timeToMinutes(slotTime);

      const endMinutes = Math.min(
        startMinutes + 60,
        1440
      );

      openEditor({
        type: "plan",
        start: slotTime,
        end: minutesToTime(endMinutes)
      });
    });

    timeline.append(slot);
  }

  const dayItems =
    getItemsForDate(state.selectedDate);

  dayItems.forEach((item) => {
    const startIndex =
      timeToMinutes(item.start) / 30;

    const endIndex =
      timeToMinutes(item.end) / 30;

    if (
      !Number.isInteger(startIndex) ||
      !Number.isInteger(endIndex) ||
      endIndex <= startIndex
    ) {
      return;
    }

    const eventBlock =
      document.createElement("button");

    eventBlock.type = "button";

    eventBlock.className =
      `event-block ${item.type} ${item.category}`;

    eventBlock.style.gridRow =
      `${startIndex + 1} / ${endIndex + 1}`;

    eventBlock.style.gridColumn = "2";

    const eventTitle =
      document.createElement("strong");

    eventTitle.textContent = item.title;

    const eventTime =
      document.createElement("span");

    eventTime.textContent =
      `${item.start}–${item.end}`;

    eventBlock.append(
      eventTitle,
      eventTime
    );

    eventBlock.addEventListener("click", () => {
      openEditor({ item });
    });

    timeline.append(eventBlock);
  });
}

/* Open editor */

function openEditor({
  type = "plan",
  start = "09:00",
  end = "10:00",
  item = null
} = {}) {
  eventForm.reset();
  formMessage.textContent = "";

  state.editingId =
    item?.id ?? null;

  const itemType =
    item?.type ?? type;

  itemTypeInput.value =
    itemType;

  const isPlan =
    itemType === "plan";

  planFields.classList.toggle(
    "hidden",
    !isPlan
  );

  scheduleFields.classList.toggle(
    "hidden",
    isPlan
  );

  if (item) {
    editorLabel.textContent =
      isPlan
        ? "edit shared plan"
        : "edit schedule";

    editorHeading.textContent =
      item.title;

    saveEventButton.textContent =
      "Save changes";
  } else {
    editorLabel.textContent =
      isPlan
        ? "create a plan"
        : "add my availability";

    editorHeading.textContent =
      isPlan
        ? "Add an event"
        : "Add my schedule";

    saveEventButton.textContent =
      isPlan
        ? "Add event"
        : "Add schedule";
  }

  templateSelect.value =
    item?.template ?? "";

  scheduleTypeSelect.value =
    item?.category === "busy"
      ? "busy"
      : "work";

  eventDateInput.value =
    item?.date ??
    state.selectedDate ??
    toDateKey(new Date());

  startTimeSelect.value =
    item?.start ?? start;

  endTimeSelect.value =
    item?.end ?? end;

  notesInput.value =
    item?.notes ?? "";

  deleteEventButton.classList.toggle(
    "hidden",
    !item
  );

  eventModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeEditor() {
  eventModal.classList.add("hidden");

  state.editingId = null;
  formMessage.textContent = "";

  if (
    dayModal.classList.contains("hidden")
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}

/* Template duration */

function applyTemplateDuration() {
  const selectedTemplate =
    templates[templateSelect.value];

  if (!selectedTemplate) {
    return;
  }

  const startMinutes =
    timeToMinutes(startTimeSelect.value);

  const newEndMinutes = Math.min(
    startMinutes +
      selectedTemplate.duration,
    1440
  );

  endTimeSelect.value =
    minutesToTime(newEndMinutes);
}

/* Save */

function saveItem(event) {
  event.preventDefault();

  formMessage.textContent = "";

  const type =
    itemTypeInput.value;

  const date =
    eventDateInput.value;

  const start =
    startTimeSelect.value;

  const end =
    endTimeSelect.value;

  if (!date) {
    formMessage.textContent =
      "Please select a date.";

    return;
  }

  const startMinutes =
    timeToMinutes(start);

  const endMinutes =
    timeToMinutes(end);

  if (endMinutes <= startMinutes) {
    formMessage.textContent =
      "The end time must be later than the start time.";

    return;
  }

  let title;
  let template = null;
  let category;

  if (type === "plan") {
    template =
      templateSelect.value;

    const selectedTemplate =
      templates[template];

    if (!selectedTemplate) {
      formMessage.textContent =
        "Please select a template.";

      return;
    }

    title =
      selectedTemplate.title;

    category = "plan";
  } else {
    category =
      scheduleTypeSelect.value;

    title =
      category === "work"
        ? "Work"
        : "Busy";
  }

  const conflictingItem =
    state.items.find((item) => {
      if (
        item.id === state.editingId ||
        item.date !== date
      ) {
        return false;
      }

      const existingStart =
        timeToMinutes(item.start);

      const existingEnd =
        timeToMinutes(item.end);

      return (
        startMinutes < existingEnd &&
        endMinutes > existingStart
      );
    });

  if (conflictingItem) {
    formMessage.textContent =
      `This overlaps with “${conflictingItem.title}” ` +
      `from ${conflictingItem.start} to ${conflictingItem.end}.`;

    return;
  }

  const savedItem = {
    id:
      state.editingId ||
      createId(),

    type,
    date,
    start,
    end,
    title,
    template,
    category,

    notes:
      notesInput.value.trim()
  };

  if (state.editingId) {
    state.items = state.items.map((item) => {
      return item.id === state.editingId
        ? savedItem
        : item;
    });
  } else {
    state.items.push(savedItem);
  }

  persistItems();

  state.selectedDate = date;

  const selectedDateObject =
    new Date(`${date}T00:00:00`);

  state.currentDate =
    new Date(
      selectedDateObject.getFullYear(),
      selectedDateObject.getMonth(),
      1
    );

  dayTitle.textContent =
    formatDateLong(date);

  closeEditor();
  renderTimeline();
  renderCalendar();
}

/* Delete */

function deleteCurrentItem() {
  if (!state.editingId) {
    return;
  }

  state.items = state.items.filter(
    (item) => item.id !== state.editingId
  );

  persistItems();

  closeEditor();
  renderTimeline();
  renderCalendar();
}

/* Time dropdowns */

function buildTimeOptions() {
  startTimeSelect.innerHTML = "";
  endTimeSelect.innerHTML = "";

  for (
    let index = 0;
    index < 48;
    index += 1
  ) {
    const time =
      indexToTime(index);

    startTimeSelect.add(
      new Option(time, time)
    );
  }

  for (
    let index = 1;
    index <= 48;
    index += 1
  ) {
    const time =
      indexToTime(index);

    endTimeSelect.add(
      new Option(time, time)
    );
  }
}

/* Helpers */

function getItemsForDate(dateKey) {
  return state.items
    .filter((item) => item.date === dateKey)
    .sort((firstItem, secondItem) => {
      return (
        timeToMinutes(firstItem.start) -
        timeToMinutes(secondItem.start)
      );
    });
}

function makeDateKey(
  year,
  zeroBasedMonth,
  day
) {
  const month =
    String(zeroBasedMonth + 1)
      .padStart(2, "0");

  const date =
    String(day)
      .padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function toDateKey(date) {
  return makeDateKey(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function formatDateLong(dateKey) {
  const date =
    new Date(`${dateKey}T00:00:00`);

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

function indexToTime(index) {
  return minutesToTime(index * 30);
}

function minutesToTime(totalMinutes) {
  if (totalMinutes === 1440) {
    return "24:00";
  }

  const hours =
    Math.floor(totalMinutes / 60);

  const minutes =
    totalMinutes % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0")
  );
}

function timeToMinutes(time) {
  if (time === "24:00") {
    return 1440;
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

/* Browser storage */

function loadItems() {
  try {
    const savedItems =
      localStorage.getItem(STORAGE_KEY);

    return savedItems
      ? JSON.parse(savedItems)
      : [];
  } catch (error) {
    console.error(
      "Could not load calendar items:",
      error
    );

    return [];
  }
}

function persistItems() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.items)
    );
  } catch (error) {
    console.error(
      "Could not save calendar items:",
      error
    );
  }
}