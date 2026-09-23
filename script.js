// ======================================================
// CHURCHFLOW CMS - MAIN JAVASCRIPT
// PART 1 OF 2
// ======================================================

const API_URL = "http://127.0.0.1:8000";

// ======================================================
// GLOBAL DATA
// ======================================================

let allMembers = [];
let allAttendance = [];
let departments = [];
let allEvents = [];
let allOfferings = [];
let allUsers = [];
let currentUser = null;


// ======================================================
// AUTHENTICATION
// ======================================================

function getLoggedInUser() {
    const localUser = localStorage.getItem("churchflowUser");
    const sessionUser = sessionStorage.getItem("churchflowUser");

    if (localUser) {
        return JSON.parse(localUser);
    }

    if (sessionUser) {
        return JSON.parse(sessionUser);
    }

    return null;
}


function checkAuthentication() {
    currentUser = getLoggedInUser();

    if (!currentUser) {
        window.location.href = "./login.html";
        return false;
    }

    return true;
}


function logout() {
    localStorage.removeItem("churchflowUser");
    sessionStorage.removeItem("churchflowUser");

    window.location.href = "./login.html";
}


// ======================================================
// USER INFORMATION
// ======================================================

function displayLoggedInUser() {
    if (!currentUser) {
        return;
    }

    const usernameElement = document.getElementById("loggedInUsername");
    const roleElement = document.getElementById("loggedInRole");

    if (usernameElement) {
        usernameElement.textContent = currentUser.username || "User";
    }

    if (roleElement) {
        roleElement.textContent = currentUser.role || "User";
    }
}


// ======================================================
// ROLE PERMISSIONS
// ======================================================

function normalizeRole(role) {
    return String(role || "").toLowerCase();
}


function isAdmin() {
    return normalizeRole(currentUser?.role) === "admin";
}


function isPastor() {
    return normalizeRole(currentUser?.role) === "pastor";
}


function isStaff() {
    return normalizeRole(currentUser?.role) === "staff";
}


function canManageUsers() {
    return isAdmin();
}


function canManageSettings() {
    return isAdmin();
}


// ======================================================
// PAGE NAVIGATION
// IMPORTANT: HTML USES "active-page"
// ======================================================

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {
        page.classList.remove("active-page");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    const title = document.getElementById("pageTitle");

    const titles = {
        dashboard: "Dashboard",
        members: "Members",
        attendance: "Attendance",
        departments: "Departments",
        events: "Events",
        offerings: "Offerings",
        reports: "Reports",
        users: "Users",
        settings: "Settings"
    };

    if (title) {
        title.textContent = titles[pageId] || "ChurchFlow CMS";
    }

    // Refresh data when opening pages
    if (pageId === "dashboard") {
        refreshDashboard();
    }

    if (pageId === "members") {
        loadMembers();
    }

    if (pageId === "attendance") {
        loadAttendance();
    }

    if (pageId === "departments") {
        loadDepartments();
    }

    if (pageId === "events") {
        loadEvents();
    }

    if (pageId === "offerings") {
        loadOfferings();
    }

    if (pageId === "reports") {
        loadReports();
    }

    if (pageId === "users") {
        loadUsers();
    }

    if (pageId === "settings") {
        loadSettings();
    }
}


// ======================================================
// API HELPERS
// ======================================================

async function getJSON(url, options = {}) {

    try {

        const response = await fetch(url, options);

        const contentType = response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {

            let message = "Request failed";

            if (typeof data === "object" && data?.detail) {
                message = data.detail;
            } else if (typeof data === "string" && data) {
                message = data;
            }

            throw new Error(message);
        }

        return data;

    } catch (error) {

        console.error("API Error:", error);

        throw error;
    }
}


// ======================================================
// UTILITY FUNCTIONS
// ======================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "";
    }
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}


function getTodayISO() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatTime(timeValue) {

    if (!timeValue) {
        return "-";
    }

    const parts = String(timeValue).split(":");

    if (parts.length < 2) {
        return timeValue;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minute} ${suffix}`;
}


function showMessage(message) {
    alert(message);
}


// ======================================================
// MEMBERS
// ======================================================

async function loadMembers() {

    try {

        const data = await getJSON(`${API_URL}/members`);

        allMembers = Array.isArray(data) ? data : [];

        renderMembers();
        updateMemberDropdown();

        refreshDashboard();

    } catch (error) {

        console.error("Unable to load members:", error);

        const list = document.getElementById("memberList");

        if (list) {
            list.innerHTML = `
                <tr>
                    <td colspan="7">
                        Unable to load members.
                    </td>
                </tr>
            `;
        }
    }
}


function getMemberName(member) {

    if (!member) {
        return "Unknown Member";
    }

    if (member.name) {
        return member.name;
    }

    const firstName = member.first_name || "";
    const lastName = member.last_name || "";

    return `${firstName} ${lastName}`.trim() || "Unknown Member";
}


function renderMembers() {

    const list = document.getElementById("memberList");

    if (!list) {
        return;
    }

    if (allMembers.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    No members found.
                </td>
            </tr>
        `;

        return;
    }

    list.innerHTML = allMembers.map(function (member) {

        const id = member.id;

        const name = getMemberName(member);

        const gender = member.gender || "-";

        const phone = member.phone || "-";

        const department = member.department || "-";

        const status = member.status || "Active";

        return `
            <tr>

                <td>
                    MEM-${escapeHTML(id)}
                </td>

                <td>
                    ${escapeHTML(name)}
                </td>

                <td>
                    ${escapeHTML(gender)}
                </td>

                <td>
                    ${escapeHTML(phone)}
                </td>

                <td>
                    ${escapeHTML(department)}
                </td>

                <td>
                    <span class="status-badge">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editMember(${id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteMember(${id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// MEMBER SEARCH
// ======================================================

function searchMembers() {

    const searchInput = document.getElementById("memberSearch");

    const list = document.getElementById("memberList");

    if (!searchInput || !list) {
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredMembers = allMembers.filter(function (member) {

        const name = getMemberName(member).toLowerCase();

        const phone = String(member.phone || "").toLowerCase();

        const email = String(member.email || "").toLowerCase();

        const department = String(member.department || "").toLowerCase();

        return (
            name.includes(searchTerm) ||
            phone.includes(searchTerm) ||
            email.includes(searchTerm) ||
            department.includes(searchTerm)
        );
    });


    if (filteredMembers.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="7">
                    No matching members found.
                </td>
            </tr>
        `;

        return;
    }


    list.innerHTML = filteredMembers.map(function (member) {

        const id = member.id;

        const name = getMemberName(member);

        const gender = member.gender || "-";

        const phone = member.phone || "-";

        const department = member.department || "-";

        const status = member.status || "Active";

        return `
            <tr>

                <td>MEM-${escapeHTML(id)}</td>

                <td>${escapeHTML(name)}</td>

                <td>${escapeHTML(gender)}</td>

                <td>${escapeHTML(phone)}</td>

                <td>${escapeHTML(department)}</td>

                <td>
                    <span class="status-badge">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editMember(${id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteMember(${id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// MEMBER FORM
// ======================================================

function resetMemberForm() {

    const form = document.getElementById("memberForm");

    if (form) {
        form.reset();
    }

    const memberId = document.getElementById("memberId");

    if (memberId) {
        memberId.value = "";
    }

    const submitButton = document.querySelector(
        "#memberForm button[type='submit']"
    );

    if (submitButton) {
        submitButton.textContent = "Save Member";
    }

    const cancelButton = document.getElementById("cancelMemberEdit");

    if (cancelButton) {
        cancelButton.style.display = "none";
    }
}


async function saveMember(event) {

    event.preventDefault();

    const memberId = document.getElementById("memberId")?.value;

    const fullName = document.getElementById("memberName")?.value.trim();

    const gender = document.getElementById("memberGender")?.value;

    const dob = document.getElementById("memberDob")?.value || null;

    const phone = document.getElementById("memberPhone")?.value.trim();

    const address = document.getElementById("memberAddress")?.value.trim();

    const dateJoined =
        document.getElementById("memberDateJoined")?.value || null;

    const department =
        document.getElementById("memberDepartment")?.value;

    const status =
        document.getElementById("memberStatus")?.value || "Active";


    if (!fullName) {
        alert("Please enter the member's name.");
        return;
    }


    const nameParts = fullName.split(/\s+/);

    const firstName = nameParts.shift() || "";

    const lastName = nameParts.join(" ") || "";


    const payload = {

        name: fullName,

        first_name: firstName,

        last_name: lastName,

        gender: gender || null,

        dob: dob,

        date_of_birth: dob,

        phone: phone || null,

        address: address || null,

        date_joined: dateJoined,

        membership_date: dateJoined,

        department: department || null,

        status: status

    };


    try {

        let response;

        if (memberId) {

            response = await getJSON(
                `${API_URL}/members/${memberId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

        } else {

            response = await getJSON(
                `${API_URL}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );
        }


        alert(
            memberId
                ? "Member updated successfully."
                : "Member added successfully."
        );


        resetMemberForm();

        await loadMembers();

    } catch (error) {

        console.error("Save member error:", error);

        alert(
            "Unable to save member.\n\n" +
            error.message
        );
    }
}


// ======================================================
// EDIT MEMBER
// ======================================================

function editMember(id) {

    const member = allMembers.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!member) {
        alert("Member not found.");
        return;
    }


    const memberId = document.getElementById("memberId");

    const memberName = document.getElementById("memberName");

    const memberGender = document.getElementById("memberGender");

    const memberDob = document.getElementById("memberDob");

    const memberPhone = document.getElementById("memberPhone");

    const memberAddress = document.getElementById("memberAddress");

    const memberDateJoined =
        document.getElementById("memberDateJoined");

    const memberDepartment =
        document.getElementById("memberDepartment");

    const memberStatus =
        document.getElementById("memberStatus");


    if (memberId) {
        memberId.value = member.id;
    }

    if (memberName) {
        memberName.value = getMemberName(member);
    }

    if (memberGender) {
        memberGender.value = member.gender || "";
    }

    if (memberDob) {
        memberDob.value =
            member.dob ||
            member.date_of_birth ||
            "";
    }

    if (memberPhone) {
        memberPhone.value = member.phone || "";
    }

    if (memberAddress) {
        memberAddress.value = member.address || "";
    }

    if (memberDateJoined) {
        memberDateJoined.value =
            member.date_joined ||
            member.membership_date ||
            "";
    }

    if (memberDepartment) {
        memberDepartment.value = member.department || "";
    }

    if (memberStatus) {
        memberStatus.value = member.status || "Active";
    }


    const submitButton = document.querySelector(
        "#memberForm button[type='submit']"
    );

    if (submitButton) {
        submitButton.textContent = "Update Member";
    }


    const cancelButton =
        document.getElementById("cancelMemberEdit");

    if (cancelButton) {
        cancelButton.style.display = "inline-block";
    }


    const membersPage = document.getElementById("members");

    if (membersPage) {
        membersPage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ======================================================
// DELETE MEMBER
// ======================================================

async function deleteMember(id) {

    const member = allMembers.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!member) {
        return;
    }

    const name = getMemberName(member);

    const confirmed = confirm(
        `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/members/${id}`,
            {
                method: "DELETE"
            }
        );


        alert("Member deleted successfully.");

        await loadMembers();

    } catch (error) {

        console.error("Delete member error:", error);

        alert(
            "Unable to delete member.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DEPARTMENTS
// ======================================================

async function loadDepartments() {

    try {

        const data = await getJSON(
            `${API_URL}/departments`
        );

        departments = Array.isArray(data) ? data : [];

        renderDepartments();

        updateDepartmentDropdown();

    } catch (error) {

        console.error(
            "Unable to load departments:",
            error
        );
    }
}


function renderDepartments() {

    const list =
        document.getElementById("departmentList");

    if (!list) {
        return;
    }


    if (departments.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No departments found.
            </div>
        `;

        return;
    }


    list.innerHTML = departments.map(function (department) {

        return `
            <div class="department-card">

                <h3>
                    ${escapeHTML(department.name)}
                </h3>

                <p>
                    ${escapeHTML(
                        department.description || "No description"
                    )}
                </p>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteDepartment(${department.id})"
                >
                    Delete
                </button>

            </div>
        `;

    }).join("");
}


function updateDepartmentDropdown() {

    const dropdown =
        document.getElementById("memberDepartment");

    if (!dropdown) {
        return;
    }


    const currentValue = dropdown.value;


    dropdown.innerHTML = `
        <option value="">Select Department</option>
        ${departments.map(function (department) {
            return `
                <option value="${escapeHTML(department.name)}">
                    ${escapeHTML(department.name)}
                </option>
            `;
        }).join("")}
    `;


    if (currentValue) {
        dropdown.value = currentValue;
    }
}


async function saveDepartment(event) {

    event.preventDefault();


    const name =
        document.getElementById("departmentName")?.value.trim();

    const description =
        document.getElementById("departmentDescription")?.value.trim();


    if (!name) {
        alert("Please enter a department name.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/departments`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    description: description || null
                })
            }
        );


        alert("Department added successfully.");

        document.getElementById("departmentForm")?.reset();

        await loadDepartments();

    } catch (error) {

        console.error(
            "Save department error:",
            error
        );

        alert(
            "Unable to save department.\n\n" +
            error.message
        );
    }
}


async function deleteDepartment(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this department?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/departments/${id}`,
            {
                method: "DELETE"
            }
        );


        alert("Department deleted successfully.");

        await loadDepartments();

    } catch (error) {

        console.error(
            "Delete department error:",
            error
        );

        alert(
            "Unable to delete department.\n\n" +
            error.message
        );
    }
}


// ======================================================
// ATTENDANCE
// ======================================================

async function loadAttendance() {

    try {

        const data = await getJSON(
            `${API_URL}/attendance`
        );

        allAttendance = Array.isArray(data) ? data : [];

        renderAttendance();

        updateMemberDropdown();

        refreshDashboard();

    } catch (error) {

        console.error(
            "Unable to load attendance:",
            error
        );

        const list =
            document.getElementById("attendanceList");

        if (list) {

            list.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load attendance.
                    </td>
                </tr>
            `;
        }
    }
}


function updateMemberDropdown() {

    const dropdown =
        document.getElementById("attendanceMember");

    if (!dropdown) {
        return;
    }


    const currentValue = dropdown.value;


    dropdown.innerHTML = `
        <option value="">
            Select Member
        </option>

        ${allMembers.map(function (member) {

            return `
                <option value="${member.id}">
                    ${escapeHTML(getMemberName(member))}
                </option>
            `;

        }).join("")}
    `;


    if (currentValue) {
        dropdown.value = currentValue;
    }
}


function renderAttendance() {

    const list =
        document.getElementById("attendanceList");

    if (!list) {
        return;
    }


    if (allAttendance.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="5">
                    No attendance records found.
                </td>
            </tr>
        `;

        return;
    }


    list.innerHTML = allAttendance.map(function (record) {

        const member = allMembers.find(function (item) {

            return Number(item.id) ===
                Number(record.member_id);

        });


        const memberName =
            member
                ? getMemberName(member)
                : `Member ${record.member_id}`;


        return `
            <tr>

                <td>
                    ${escapeHTML(record.id)}
                </td>

                <td>
                    MEM-${escapeHTML(record.member_id)}
                    <br>
                    <small>
                        ${escapeHTML(memberName)}
                    </small>
                </td>

                <td>
                    ${formatDate(record.attendance_date)}
                </td>

                <td>
                    <span class="status-badge">
                        ${escapeHTML(record.status)}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteAttendance(${record.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// SAVE ATTENDANCE
// ======================================================

async function saveAttendance(event) {

    event.preventDefault();


    const memberId =
        document.getElementById("attendanceMember")?.value;

    const attendanceDate =
        document.getElementById("attendanceDate")?.value;

    const status =
        document.getElementById("attendanceStatus")?.value;


    if (!memberId) {
        alert("Please select a member.");
        return;
    }


    if (!attendanceDate) {
        alert("Please select a date.");
        return;
    }


    if (!status) {
        alert("Please select attendance status.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/attendance`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    member_id: Number(memberId),

                    attendance_date: attendanceDate,

                    status: status

                })
            }
        );


        alert(
            "Attendance recorded successfully."
        );


        document.getElementById(
            "attendanceForm"
        )?.reset();


        const dateInput =
            document.getElementById("attendanceDate");

        if (dateInput) {
            dateInput.value = getTodayISO();
        }


        await loadAttendance();

    } catch (error) {

        console.error(
            "Save attendance error:",
            error
        );

        alert(
            "Unable to save attendance.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DELETE ATTENDANCE
// ======================================================

async function deleteAttendance(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/attendance/${id}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Attendance record deleted."
        );


        await loadAttendance();

    } catch (error) {

        console.error(
            "Delete attendance error:",
            error
        );

        alert(
            "Unable to delete attendance.\n\n" +
            error.message
        );
    }
}


// ======================================================
// END OF PART 1
// ======================================================
// ======================================================
// CHURCHFLOW CMS - MAIN JAVASCRIPT
// PART 2 OF 2
// ======================================================


// ======================================================
// EVENTS
// ======================================================

async function loadEvents() {

    try {

        const data = await getJSON(
            `${API_URL}/events`
        );

        allEvents = Array.isArray(data) ? data : [];

        renderEvents();

        refreshDashboard();

    } catch (error) {

        console.error(
            "Unable to load events:",
            error
        );

        const list =
            document.getElementById("eventList");

        if (list) {

            list.innerHTML = `
                <div class="empty-state">
                    Unable to load events.
                </div>
            `;
        }
    }
}


function renderEvents() {

    const list =
        document.getElementById("eventList");

    if (!list) {
        return;
    }


    if (allEvents.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No events found.
            </div>
        `;

        return;
    }


    list.innerHTML = allEvents.map(function (event) {

        return `
            <div class="event-card">

                <h3>
                    ${escapeHTML(event.title)}
                </h3>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(event.date)}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${formatTime(event.time)}
                </p>

                <p>
                    <strong>Venue:</strong>
                    ${escapeHTML(event.venue)}
                </p>

                <p>
                    ${escapeHTML(
                        event.description || ""
                    )}
                </p>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteEvent(${event.id})"
                >
                    Delete
                </button>

            </div>
        `;

    }).join("");
}


// ======================================================
// SAVE EVENT
// ======================================================

async function saveEvent(event) {

    event.preventDefault();


    const title =
        document.getElementById("eventTitle")?.value.trim();

    const date =
        document.getElementById("eventDate")?.value;

    const time =
        document.getElementById("eventTime")?.value;

    const venue =
        document.getElementById("eventVenue")?.value.trim();

    const description =
        document.getElementById("eventDescription")?.value.trim();


    if (!title) {
        alert("Please enter the event title.");
        return;
    }

    if (!date) {
        alert("Please select the event date.");
        return;
    }

    if (!time) {
        alert("Please select the event time.");
        return;
    }

    if (!venue) {
        alert("Please enter the venue.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/events`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    title: title,

                    date: date,

                    time: time,

                    venue: venue,

                    description: description || null

                })
            }
        );


        alert("Event added successfully.");


        document.getElementById(
            "eventForm"
        )?.reset();


        await loadEvents();

    } catch (error) {

        console.error(
            "Save event error:",
            error
        );

        alert(
            "Unable to save event.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DELETE EVENT
// ======================================================

async function deleteEvent(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/events/${id}`,
            {
                method: "DELETE"
            }
        );


        alert("Event deleted successfully.");

        await loadEvents();

    } catch (error) {

        console.error(
            "Delete event error:",
            error
        );

        alert(
            "Unable to delete event.\n\n" +
            error.message
        );
    }
}


// ======================================================
// OFFERINGS
// ======================================================

async function loadOfferings() {

    try {

        const data = await getJSON(
            `${API_URL}/offerings`
        );

        allOfferings = Array.isArray(data)
            ? data
            : [];

        renderOfferings();

    } catch (error) {

        console.error(
            "Unable to load offerings:",
            error
        );

        const list =
            document.getElementById("offeringList");

        if (list) {

            list.innerHTML = `
                <tr>
                    <td colspan="6">
                        Unable to load offerings.
                    </td>
                </tr>
            `;
        }
    }
}


function renderOfferings() {

    const list =
        document.getElementById("offeringList");

    if (!list) {
        return;
    }


    if (allOfferings.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="6">
                    No offerings found.
                </td>
            </tr>
        `;

        return;
    }


    list.innerHTML = allOfferings.map(function (offering) {

        return `
            <tr>

                <td>
                    ${escapeHTML(offering.id)}
                </td>

                <td>
                    ${formatDate(offering.date)}
                </td>

                <td>
                    GH₵ ${escapeHTML(offering.amount)}
                </td>

                <td>
                    ${escapeHTML(offering.category)}
                </td>

                <td>
                    ${escapeHTML(
                        offering.description || "-"
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteOffering(${offering.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// SAVE OFFERING
// ======================================================

async function saveOffering(event) {

    event.preventDefault();


    const date =
        document.getElementById("offeringDate")?.value;

    const amount =
        document.getElementById("offeringAmount")?.value.trim();

    const category =
        document.getElementById("offeringCategory")?.value;

    const description =
        document.getElementById("offeringDescription")?.value.trim();


    if (!date) {
        alert("Please select the date.");
        return;
    }

    if (!amount) {
        alert("Please enter the amount.");
        return;
    }

    if (!category) {
        alert("Please select a category.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/offerings`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    date: date,

                    amount: amount,

                    category: category,

                    description: description || null

                })
            }
        );


        alert(
            "Offering recorded successfully."
        );


        document.getElementById(
            "offeringForm"
        )?.reset();


        await loadOfferings();

    } catch (error) {

        console.error(
            "Save offering error:",
            error
        );

        alert(
            "Unable to save offering.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DELETE OFFERING
// ======================================================

async function deleteOffering(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this offering?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/offerings/${id}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Offering deleted successfully."
        );


        await loadOfferings();

    } catch (error) {

        console.error(
            "Delete offering error:",
            error
        );

        alert(
            "Unable to delete offering.\n\n" +
            error.message
        );
    }
}


// ======================================================
// USERS
// ======================================================

async function loadUsers() {

    try {

        const data = await getJSON(
            `${API_URL}/users`
        );

        allUsers = Array.isArray(data) ? data : [];

        renderUsers();

    } catch (error) {

        console.error(
            "Unable to load users:",
            error
        );

        const list =
            document.getElementById("userList");

        if (list) {

            list.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load users.
                    </td>
                </tr>
            `;
        }
    }
}


function renderUsers() {

    const list =
        document.getElementById("userList");

    if (!list) {
        return;
    }


    if (allUsers.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="5">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    list.innerHTML = allUsers.map(function (user) {

        return `
            <tr>

                <td>
                    ${escapeHTML(user.id)}
                </td>

                <td>
                    ${escapeHTML(user.username)}
                </td>

                <td>
                    ${escapeHTML(user.email)}
                </td>

                <td>
                    ${escapeHTML(user.role)}
                </td>

                <td>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteUser(${user.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


// ======================================================
// SAVE USER
// ======================================================

async function saveUser(event) {

    event.preventDefault();


    const username =
        document.getElementById("userName")?.value.trim();

    const email =
        document.getElementById("userEmail")?.value.trim();

    const password =
        document.getElementById("userPassword")?.value;

    const role =
        document.getElementById("userRole")?.value;


    if (!username) {
        alert("Please enter a username.");
        return;
    }

    if (!email) {
        alert("Please enter an email.");
        return;
    }

    if (!password) {
        alert("Please enter a password.");
        return;
    }

    if (!role) {
        alert("Please select a role.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/users`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    username: username,

                    email: email,

                    password: password,

                    role: normalizeRole(role)

                })
            }
        );


        alert("User created successfully.");


        document.getElementById(
            "userForm"
        )?.reset();


        await loadUsers();

    } catch (error) {

        console.error(
            "Save user error:",
            error
        );

        alert(
            "Unable to create user.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DELETE USER
// ======================================================

async function deleteUser(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/users/${id}`,
            {
                method: "DELETE"
            }
        );


        alert("User deleted successfully.");

        await loadUsers();

    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );

        alert(
            "Unable to delete user.\n\n" +
            error.message
        );
    }
}


// ======================================================
// SETTINGS
// ======================================================

async function loadSettings() {

    try {

        const data = await getJSON(
            `${API_URL}/settings`
        );


        if (Array.isArray(data)) {

            if (data.length > 0) {
                fillSettings(data[0]);
            }

        } else if (data && typeof data === "object") {

            fillSettings(data);
        }

    } catch (error) {

        console.error(
            "Unable to load settings:",
            error
        );
    }
}


function fillSettings(settings) {

    const systemName =
        document.getElementById("systemName");

    const systemTheme =
        document.getElementById("systemTheme");


    if (systemName) {
        systemName.value =
            settings.system_name || "ChurchFlow CMS";
    }


    if (systemTheme) {
        systemTheme.value =
            settings.theme || "light";
    }
}


// ======================================================
// SAVE SETTINGS
// ======================================================

async function saveSettings(event) {

    event.preventDefault();


    const systemName =
        document.getElementById("systemName")?.value.trim();

    const theme =
        document.getElementById("systemTheme")?.value;


    if (!systemName) {
        alert("Please enter the system name.");
        return;
    }


    try {

        await getJSON(
            `${API_URL}/settings`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    system_name: systemName,

                    theme: theme || "light"

                })
            }
        );


        alert(
            "Settings saved successfully."
        );


        await loadSettings();

    } catch (error) {

        console.error(
            "Save settings error:",
            error
        );

        alert(
            "Unable to save settings.\n\n" +
            error.message
        );
    }
}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboardStats() {

    const total =
        allMembers.length;


    const male =
        allMembers.filter(function (member) {

            return String(member.gender || "")
                .toLowerCase() === "male";

        }).length;


    const female =
        allMembers.filter(function (member) {

            return String(member.gender || "")
                .toLowerCase() === "female";

        }).length;


    const active =
        allMembers.filter(function (member) {

            return String(member.status || "Active")
                .toLowerCase() === "active";

        }).length;


    setText(
        "totalMembers",
        total
    );


    setText(
        "maleMembers",
        male
    );


    setText(
        "femaleMembers",
        female
    );


    setText(
        "activeMembers",
        active
    );
}


// ======================================================
// TODAY ATTENDANCE
// ======================================================

function updateAttendanceDashboard() {

    const today =
        getTodayISO();


    const todayRecords =
        allAttendance.filter(function (record) {

            return record.attendance_date === today;

        });


    const present =
        todayRecords.filter(function (record) {

            return String(record.status || "")
                .toLowerCase() === "present";

        }).length;


    const absent =
        todayRecords.filter(function (record) {

            return String(record.status || "")
                .toLowerCase() === "absent";

        }).length;


    const total =
        todayRecords.length;


    const percentage =
        total > 0
            ? Math.round((present / total) * 100)
            : 0;


    setText(
        "attendancePercentage",
        `${percentage}%`
    );


    setText(
        "presentCount",
        present
    );


    setText(
        "absentCount",
        absent
    );


    setText(
        "attendanceTotal",
        total
    );


    const circle =
        document.getElementById("attendanceCircle");


    if (circle) {

        circle.style.setProperty(
            "--attendance-percent",
            `${percentage}%`
        );
    }
}


// ======================================================
// RECENT MEMBERS
// ======================================================

function renderRecentMembers() {

    const container =
        document.getElementById("recentMembers");

    if (!container) {
        return;
    }


    const recentMembers =
        [...allMembers]
            .sort(function (a, b) {

                return Number(b.id) - Number(a.id);

            })
            .slice(0, 5);


    if (recentMembers.length === 0) {

        container.innerHTML = `
            <p>
                No members available.
            </p>
        `;

        return;
    }


    container.innerHTML =
        recentMembers.map(function (member) {

            return `
                <div class="recent-member">

                    <div>

                        <strong>
                            ${escapeHTML(
                                getMemberName(member)
                            )}
                        </strong>

                        <small>
                            MEM-${escapeHTML(member.id)}
                        </small>

                    </div>

                    <span>
                        ${formatDate(
                            member.date_joined ||
                            member.membership_date
                        )}
                    </span>

                </div>
            `;

        }).join("");
}


// ======================================================
// UPCOMING EVENTS
// ======================================================

function renderDashboardEvents() {

    const container =
        document.getElementById("dashboardEvents");

    if (!container) {
        return;
    }


    const today =
        getTodayISO();


    const upcomingEvents =
        allEvents
            .filter(function (event) {

                return event.date >= today;

            })
            .sort(function (a, b) {

                return String(a.date)
                    .localeCompare(String(b.date));

            })
            .slice(0, 5);


    if (upcomingEvents.length === 0) {

        container.innerHTML = `
            <p>
                No upcoming events.
            </p>
        `;

        return;
    }


    container.innerHTML =
        upcomingEvents.map(function (event) {

            return `
                <div class="dashboard-event">

                    <div>

                        <strong>
                            ${escapeHTML(event.title)}
                        </strong>

                        <small>
                            ${formatDate(event.date)}
                            •
                            ${formatTime(event.time)}
                        </small>

                    </div>

                    <span>
                        ${escapeHTML(event.venue)}
                    </span>

                </div>
            `;

        }).join("");
}


// ======================================================
// BIRTHDAYS
// ======================================================

function getBirthdayMembers() {

    const today =
        new Date();

    const todayMonth =
        today.getMonth() + 1;

    const todayDay =
        today.getDate();


    return allMembers.filter(function (member) {

        const birthday =
            member.dob ||
            member.date_of_birth;


        if (!birthday) {
            return false;
        }


        const date =
            new Date(birthday);


        return (
            date.getMonth() + 1 === todayMonth &&
            date.getDate() === todayDay
        );

    });
}


function birthdayMessage(member) {

    const name =
        getMemberName(member);


    return `Happy Birthday ${name}! 🎉 Wishing you a blessed birthday filled with joy, peace and God's abundant blessings.`;
}


function renderBirthdays() {

    const container =
        document.getElementById("birthdayList");

    if (!container) {
        return;
    }


    const birthdays =
        getBirthdayMembers();


    if (birthdays.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No member birthdays today.
            </div>
        `;

        return;
    }


    container.innerHTML =
        birthdays.map(function (member) {

            const name =
                getMemberName(member);


            return `
                <div class="birthday-card">

                    <div class="birthday-info">

                        <div class="birthday-avatar">
                            🎂
                        </div>

                        <div>

                            <div class="birthday-name">
                                ${escapeHTML(name)}
                            </div>

                            <div class="birthday-message">
                                ${escapeHTML(
                                    birthdayMessage(member)
                                )}
                            </div>

                        </div>

                    </div>

                    <div class="birthday-actions">

                        <button
                            type="button"
                            class="birthday-button"
                            onclick="copyBirthdayMessage(${member.id})"
                        >
                            Copy Message
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ======================================================
// COPY BIRTHDAY MESSAGE
// ======================================================

async function copyBirthdayMessage(memberId) {

    const member =
        allMembers.find(function (item) {

            return Number(item.id) ===
                Number(memberId);

        });


    if (!member) {
        return;
    }


    const message =
        birthdayMessage(member);


    try {

        await navigator.clipboard.writeText(
            message
        );

        alert(
            "Birthday message copied."
        );

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        alert(
            message
        );
    }
}


// ======================================================
// REPORTS
// ======================================================

function loadReports() {

    const total =
        allMembers.length;


    const active =
        allMembers.filter(function (member) {

            return String(member.status || "Active")
                .toLowerCase() === "active";

        }).length;


    const male =
        allMembers.filter(function (member) {

            return String(member.gender || "")
                .toLowerCase() === "male";

        }).length;


    const female =
        allMembers.filter(function (member) {

            return String(member.gender || "")
                .toLowerCase() === "female";

        }).length;


    setText(
        "reportTotalMembers",
        total
    );


    setText(
        "reportActiveMembers",
        active
    );


    setText(
        "reportMaleMembers",
        male
    );


    setText(
        "reportFemaleMembers",
        female
    );
}


// ======================================================
// DASHBOARD REFRESH
// ======================================================

function refreshDashboard() {

    updateDashboardStats();

    updateAttendanceDashboard();

    renderRecentMembers();

    renderDashboardEvents();

    renderBirthdays();

    loadReports();
}


// ======================================================
// MOBILE MENU
// ======================================================

function setupMobileMenu() {

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.querySelector(".sidebar");


    if (!mobileMenu || !sidebar) {
        return;
    }


    mobileMenu.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );
}


// ======================================================
// SIDEBAR NAVIGATION
// ======================================================

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(
            "[data-page]"
        );


    navLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                const page =
                    link.getAttribute("data-page");

                if (page) {
                    showPage(page);
                }

            }
        );

    });
}


// ======================================================
// CURRENT DATE
// ======================================================

function displayCurrentDate() {

    const element =
        document.getElementById("currentDate");

    if (!element) {
        return;
    }


    const now =
        new Date();


    const day =
        String(now.getDate()).padStart(2, "0");

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const year =
        now.getFullYear();


    element.textContent =
        `${day}/${month}/${year}`;
}


// ======================================================
// FORM EVENT LISTENERS
// ======================================================

function setupForms() {

    const memberForm =
        document.getElementById("memberForm");

    if (memberForm) {

        memberForm.addEventListener(
            "submit",
            saveMember
        );
    }


    const departmentForm =
        document.getElementById("departmentForm");

    if (departmentForm) {

        departmentForm.addEventListener(
            "submit",
            saveDepartment
        );
    }


    const attendanceForm =
        document.getElementById("attendanceForm");

    if (attendanceForm) {

        attendanceForm.addEventListener(
            "submit",
            saveAttendance
        );
    }


    const eventForm =
        document.getElementById("eventForm");

    if (eventForm) {

        eventForm.addEventListener(
            "submit",
            saveEvent
        );
    }


    const offeringForm =
        document.getElementById("offeringForm");

    if (offeringForm) {

        offeringForm.addEventListener(
            "submit",
            saveOffering
        );
    }


    const userForm =
        document.getElementById("userForm");

    if (userForm) {

        userForm.addEventListener(
            "submit",
            saveUser
        );
    }


    const settingsForm =
        document.getElementById("settingsForm");

    if (settingsForm) {

        settingsForm.addEventListener(
            "submit",
            saveSettings
        );
    }


    const cancelMemberEdit =
        document.getElementById(
            "cancelMemberEdit"
        );


    if (cancelMemberEdit) {

        cancelMemberEdit.addEventListener(
            "click",
            function () {

                resetMemberForm();

            }
        );
    }
}


// ======================================================
// SEARCH EVENT
// ======================================================

function setupSearch() {

    const search =
        document.getElementById(
            "memberSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            searchMembers
        );
    }
}


// ======================================================
// LOGOUT BUTTON
// ======================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();

            }
        );
    }
}


// ======================================================
// QUICK ACTIONS
// ======================================================

function setupQuickActions() {

    /*
       Your HTML already uses:

       onclick="showPage('members')"

       onclick="showPage('attendance')"

       onclick="showPage('events')"

       Therefore we do not attach listeners
       to nonexistent IDs here.
    */

}


// ======================================================
// LOAD EVERYTHING
// ======================================================

async function loadAllData() {

    try {

        await Promise.all([

            loadMembers(),

            loadDepartments(),

            loadAttendance(),

            loadEvents(),

            loadOfferings(),

            loadUsers(),

            loadSettings()

        ]);

        refreshDashboard();

    } catch (error) {

        console.error(
            "Error loading ChurchFlow data:",
            error
        );
    }
}


// ======================================================
// PAGE INITIALIZATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // Check login
        if (!checkAuthentication()) {
            return;
        }


        // Display user
        displayLoggedInUser();


        // Display date
        displayCurrentDate();


        // Setup navigation
        setupNavigation();


        // Setup forms
        setupForms();


        // Setup search
        setupSearch();


        // Setup logout
        setupLogout();


        // Setup mobile menu
        setupMobileMenu();


        // Setup quick actions
        setupQuickActions();


        // Set today's date for attendance
        const attendanceDate =
            document.getElementById(
                "attendanceDate"
            );


        if (
            attendanceDate &&
            !attendanceDate.value
        ) {

            attendanceDate.value =
                getTodayISO();
        }


        // Load application data
        await loadAllData();


        // Start on dashboard
        showPage("dashboard");

    }
);


// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML onclick
// ======================================================

window.showPage =
    showPage;

window.logout =
    logout;

window.editMember =
    editMember;

window.deleteMember =
    deleteMember;

window.deleteDepartment =
    deleteDepartment;

window.deleteAttendance =
    deleteAttendance;

window.deleteEvent =
    deleteEvent;

window.deleteOffering =
    deleteOffering;

window.deleteUser =
    deleteUser;

window.copyBirthdayMessage =
    copyBirthdayMessage;

window.searchMembers =
    searchMembers;


// ======================================================
// END OF PART 2
// ======================================================