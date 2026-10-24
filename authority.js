// ==========================================
// SAHAYSETU AUTHORITY DASHBOARD
// ==========================================


// ==========================================
// BACKEND
// ==========================================

const API_URL = "http://127.0.0.1:8000";


// ==========================================
// GLOBAL DATA
// ==========================================

let allComplaints = [];


// ==========================================
// CHECK LOGIN
// ==========================================

const token = localStorage.getItem("access_token");


if (!token) {

    alert("Please login first.");

    window.location.href = "../AUTHO-login/authority-login.html";

}


// ==========================================
// SHOW SECTION
// ==========================================

function showSection(sectionId, clickedButton) {

    const sections =
        document.querySelectorAll(".page-section");


    sections.forEach(function(section) {

        section.classList.remove(
            "active-section"
        );

    });


    const selectedSection =
        document.getElementById(sectionId);


    if (selectedSection) {

        selectedSection.classList.add(
            "active-section"
        );

    }


    const buttons =
        document.querySelectorAll(".nav-item");


    buttons.forEach(function(button) {

        button.classList.remove("active");

    });


    if (clickedButton) {

        clickedButton.classList.add("active");

    }


    // Close mobile sidebar
    document
        .getElementById("sidebar")
        .classList.remove("open");

}


// ==========================================
// SHOW SECTION BY ID
// ==========================================

function showSectionById(sectionId) {

    const buttons =
        document.querySelectorAll(".nav-item");


    let matchingButton = null;


    buttons.forEach(function(button) {

        const onclickText =
            button.getAttribute("onclick");


        if (
            onclickText &&
            onclickText.includes(
                "'" + sectionId + "'"
            )
        ) {

            matchingButton = button;

        }

    });


    showSection(
        sectionId,
        matchingButton
    );

}


// ==========================================
// MOBILE SIDEBAR
// ==========================================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");

}


// ==========================================
// LOAD COMPLAINTS
// ==========================================

async function loadComplaints() {

    const recentContainer =
        document.getElementById(
            "recentComplaints"
        );


    const tableContainer =
        document.getElementById(
            "complaintsTable"
        );


    recentContainer.innerHTML =
        '<div class="loading">Loading complaints...</div>';


    tableContainer.innerHTML =
        '<div class="loading">Loading complaints...</div>';


    try {

        const response = await fetch(
            API_URL + "/authority/complaints",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token,

                    "Content-Type":
                        "application/json"
                }
            }
        );


        const data =
            await response.json();


        console.log(
            "Authority API response:",
            data
        );


        // ======================================
        // UNAUTHORIZED
        // ======================================

        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem(
                "access_token"
            );


            localStorage.removeItem(
                "authority_login"
            );


            alert(
                response.status === 401
                    ? "Your session has expired. Please log in again."
                    : "This account does not have authority access. Please log in with an authority account."
            );


            window.location.href =
                "../AUTHO-login/authority-login.html";


            return;

        }


        // ======================================
        // BACKEND ERROR
        // ======================================

        if (!response.ok) {

            console.error(
                "Backend error:",
                data
            );


            recentContainer.innerHTML =
                '<div class="loading">Unable to load complaints.</div>';


            tableContainer.innerHTML =
                '<div class="loading">Unable to load complaints.</div>';


            return;

        }


        // ======================================
        // NORMALIZE DATA
        // ======================================

        allComplaints =
            normalizeComplaints(data);


        console.log(
            "Complaints:",
            allComplaints
        );


        // ======================================
        // UPDATE DASHBOARD
        // ======================================

        updateStatistics(
            allComplaints
        );


        updatePriority(
            allComplaints
        );


        displayRecentComplaints(
            allComplaints
        );


        displayComplaintsTable(
            allComplaints
        );


        updateReports(
            allComplaints
        );

    }


    catch (error) {

        console.error(
            "Connection error:",
            error
        );


        recentContainer.innerHTML =
            '<div class="loading">Cannot connect to backend.</div>';


        tableContainer.innerHTML =
            '<div class="loading">Cannot connect to backend.</div>';


        alert(
            "Cannot connect to the SahaySetu backend.\n\n" +
            "Make sure your friend's FastAPI server is running."
        );

    }

}


// ==========================================
// NORMALIZE BACKEND DATA
// ==========================================

function normalizeComplaints(data) {

    if (Array.isArray(data)) {

        return data;

    }


    if (
        data &&
        Array.isArray(data.complaints)
    ) {

        return data.complaints;

    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(data.results)
    ) {

        return data.results;

    }


    return [];

}


// ==========================================
// GET COMPLAINT ID
// ==========================================

function getComplaintId(complaint) {

    return (
        complaint.complaint_id ||
        complaint.complaintId ||
        complaint.id ||
        "N/A"
    );

}


// ==========================================
// GET CATEGORY
// ==========================================

function getCategory(complaint) {

    return complaint.category || complaint.ai_category || "Not classified";

}


// ==========================================
// GET DESCRIPTION
// ==========================================

function getDescription(complaint) {

    return (
        complaint.description ||
        complaint.title ||
        complaint.issue ||
        complaint.problem ||
        "Civic complaint"
    );

}


// ==========================================
// GET LOCATION
// ==========================================

function getLocation(complaint) {

    if (
        typeof complaint.latitude === "number" &&
        typeof complaint.longitude === "number"
    ) {

        return complaint.latitude + ", " + complaint.longitude;

    }

    return (
        complaint.location ||
        complaint.address ||
        complaint.area ||
        "Location not recorded"
    );

}


// ==========================================
// GET STATUS
// ==========================================

function getStatus(complaint) {

    return (
        complaint.status ||
        complaint.complaint_status ||
        "Unknown"
    );

}


// ==========================================
// GET PRIORITY
// ==========================================

function getPriority(complaint) {

    return (
        complaint.priority ||
        complaint.severity ||
        complaint.level ||
        "Low"
    );

}


// ==========================================
// STATUS CLASS
// ==========================================

function getStatusClass(status) {

    const value =
        String(status).toLowerCase();


    if (
        value.includes("pending") ||
        value.includes("submitted") ||
        value.includes("disputed")
    ) {

        return "pending";

    }


    if (
        value.includes("progress") ||
        value.includes("assigned") ||
        value.includes("complete")
    ) {

        return "progress";

    }


    if (
        value.includes("resolved") ||
        value.includes("closed") ||
        value.includes("citizen_verified")
    ) {

        return "resolved";

    }


    return "unknown";

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics(
    complaints
) {

    let pending = 0;

    let progress = 0;

    let resolved = 0;


    complaints.forEach(
        function(complaint) {

            const status =
                String(
                    getStatus(complaint)
                ).toLowerCase();


            if (
                status.includes("pending") ||
                status.includes("submitted") ||
                status.includes("disputed")
            ) {

                pending++;

            }


            else if (
                status.includes("progress") ||
                status.includes("assigned") ||
                status.includes("complete")
            ) {

                progress++;

            }


            else if (
                status.includes("resolved") ||
                status.includes("closed") ||
                status.includes("citizen_verified")
            ) {

                resolved++;

            }

        }
    );


    document.getElementById(
        "totalComplaints"
    ).textContent =
        complaints.length;


    document.getElementById(
        "pendingComplaints"
    ).textContent =
        pending;


    document.getElementById(
        "progressComplaints"
    ).textContent =
        progress;


    document.getElementById(
        "resolvedComplaints"
    ).textContent =
        resolved;

}


// ==========================================
// UPDATE PRIORITY
// ==========================================

function updatePriority(
    complaints
) {

    let high = 0;

    let medium = 0;

    let low = 0;


    complaints.forEach(
        function(complaint) {

            const priority =
                String(
                    getPriority(complaint)
                ).toLowerCase();


            if (
                priority.includes("high") ||
                priority.includes("serious") ||
                priority.includes("critical")
            ) {

                high++;

            }


            else if (
                priority.includes("medium") ||
                priority.includes("moderate")
            ) {

                medium++;

            }


            else {

                low++;

            }

        }
    );


    document.getElementById(
        "highPriority"
    ).textContent = high;


    document.getElementById(
        "mediumPriority"
    ).textContent = medium;


    document.getElementById(
        "lowPriority"
    ).textContent = low;

}


// ==========================================
// RECENT COMPLAINTS
// ==========================================

function displayRecentComplaints(
    complaints
) {

    const container =
        document.getElementById(
            "recentComplaints"
        );


    if (
        complaints.length === 0
    ) {

        container.innerHTML =
            '<div class="loading">No complaints found.</div>';

        return;

    }


    const recent =
        complaints.slice(0, 5);


    let html = `

        <table class="complaint-table">

            <thead>

                <tr>

                    <th>ID</th>

                    <th>Category / Issue</th>

                    <th>Location</th>

                    <th>Status</th>

                </tr>

            </thead>

            <tbody>

    `;


    recent.forEach(
        function(complaint) {

            const id =
                getComplaintId(complaint);


            const description =
                getDescription(complaint);


            const location =
                getLocation(complaint);


            const status =
                getStatus(complaint);


            const statusClass =
                getStatusClass(status);


            html += `

                <tr>

                    <td>
                        <span class="complaint-id">
                            #${escapeHTML(
                                String(id)
                            )}
                        </span>
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                getCategory(complaint)
                            )}
                        </strong><br>
                        ${escapeHTML(
                            description
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            location
                        )}
                    </td>

                    <td>

                        <span class="status ${statusClass}">
                            ${escapeHTML(
                                status
                            )}
                        </span>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


// ==========================================
// FULL COMPLAINT TABLE
// ==========================================

function displayComplaintsTable(
    complaints
) {

    const container =
        document.getElementById(
            "complaintsTable"
        );


    if (
        complaints.length === 0
    ) {

        container.innerHTML =
            '<div class="loading">No complaints found.</div>';

        return;

    }


    let html = `

        <table class="complaint-table">

            <thead>

                <tr>

                    <th>ID</th>

                    <th>Complaint</th>

                    <th>Category</th>

                    <th>Location</th>

                    <th>Priority</th>

                    <th>Status</th>

                    <th>Assignment</th>

                </tr>

            </thead>

            <tbody id="complaintRows">

    `;


    complaints.forEach(
        function(complaint) {

            html += createComplaintRow(
                complaint
            );

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


// ==========================================
// CREATE TABLE ROW
// ==========================================

function createComplaintRow(
    complaint
) {

    const id =
        getComplaintId(complaint);


    const description =
        getDescription(complaint);

    const category =
        getCategory(complaint);


    const location =
        getLocation(complaint);


    const status =
        getStatus(complaint);


    const priority =
        getPriority(complaint);


    const statusClass =
        getStatusClass(status);

    const encodedId =
        encodeURIComponent(String(id)).replace(/'/g, "%27");


    return `

        <tr
            data-status="${escapeHTML(
                String(status).toLowerCase()
            )}"

            data-priority="${escapeHTML(
                String(priority).toLowerCase()
            )}"
        >

            <td>

                <span class="complaint-id">
                    #${escapeHTML(
                        String(id)
                    )}
                </span>

            </td>


            <td>
                ${escapeHTML(
                    String(description)
                )}
            </td>

            <td>
                ${escapeHTML(
                    String(category)
                )}
            </td>


            <td>
                ${escapeHTML(
                    String(location)
                )}
            </td>


            <td>
                ${escapeHTML(
                    String(priority)
                )}
            </td>


            <td>

                <span class="status ${statusClass}">
                    ${escapeHTML(
                        String(status)
                    )}
                </span>

            </td>

            <td>
                <span>
                    ${escapeHTML(
                        complaint.assigned_worker_name ||
                        "Unassigned"
                    )}
                </span>
                <div class="assignment-controls">
                    <button
                        type="button"
                        class="text-button"
                        onclick="loadEligibleWorkers('${encodedId}')"
                    >
                        Assign / Reassign
                    </button>
                    <div id="eligible-workers-${encodedId}"></div>
                </div>
            </td>

        </tr>

    `;

}


async function loadEligibleWorkers(encodedComplaintId) {
    const complaintId = decodeURIComponent(encodedComplaintId);
    const container = document.getElementById(
        "eligible-workers-" + encodedComplaintId
    );
    const token = localStorage.getItem("access_token");
    if (!container || !token) {
        window.location.href = "../AUTHO-login/authority-login.html";
        return;
    }

    container.innerHTML = '<span class="loading">Loading eligible workers...</span>';
    try {
        const response = await fetch(
            API_URL + "/authority/complaints/" +
                encodeURIComponent(complaintId) + "/eligible-workers",
            {
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("authority_login");
            window.location.href = "../AUTHO-login/authority-login.html";
            throw new Error(data.detail || "Authority access is required.");
        }
        if (!response.ok) {
            throw new Error(data.detail || "Unable to load eligible workers.");
        }
        if (!Array.isArray(data.workers)) {
            throw new Error("Eligible worker response is invalid.");
        }
        if (data.workers.length === 0) {
            container.textContent = "No active workers match this category.";
            return;
        }

        const options = data.workers.map(function (worker) {
            return `<option value="${escapeHTML(worker.id)}">${
                escapeHTML(worker.name)
            } (${escapeHTML(worker.worker_category || "Uncategorized")})</option>`;
        }).join("");
        container.innerHTML = `
            <select id="eligible-worker-${encodedComplaintId}">
                <option value="">Select a worker</option>
                ${options}
            </select>
            <button
                type="button"
                class="text-button"
                onclick="assignComplaint('${encodedComplaintId}')"
            >
                Confirm
            </button>
        `;
    } catch (error) {
        console.error("Could not load eligible workers:", error);
        container.textContent = error.message || "Unable to load eligible workers.";
    }
}


async function assignComplaint(encodedComplaintId) {
    const complaintId = decodeURIComponent(encodedComplaintId);
    const select = document.getElementById(
        "eligible-worker-" + encodedComplaintId
    );
    const workerId = Number(select && select.value);
    if (!Number.isInteger(workerId) || workerId < 1) {
        alert("Select an eligible worker before confirming the assignment.");
        return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "../AUTHO-login/authority-login.html";
        return;
    }

    try {
        const response = await fetch(
            API_URL + "/authority/complaints/" +
                encodeURIComponent(complaintId) + "/assign",
            {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ worker_id: workerId })
            }
        );
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("authority_login");
            window.location.href = "../AUTHO-login/authority-login.html";
            throw new Error(data.detail || "Authority access is required.");
        }
        if (!response.ok) {
            throw new Error(data.detail || "Complaint assignment failed.");
        }

        alert(
            "Complaint assigned to " +
            (data.assigned_worker_name || "the selected worker") + "."
        );
        await loadComplaints();
    } catch (error) {
        console.error("Could not assign complaint:", error);
        alert(error.message || "Complaint assignment failed.");
    }
}


// ==========================================
// FILTER COMPLAINTS
// ==========================================

function filterComplaints() {

    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase();


    const statusFilter =
        document
            .getElementById(
                "statusFilter"
            )
            .value
            .toLowerCase();


    const priorityFilter =
        document
            .getElementById(
                "priorityFilter"
            )
            .value
            .toLowerCase();


    const rows =
        document.querySelectorAll(
            "#complaintRows tr"
        );


    rows.forEach(
        function(row) {

            const text =
                row.textContent.toLowerCase();


            const status =
                row.dataset.status || "";


            const priority =
                row.dataset.priority || "";


            const searchMatch =
                text.includes(search);


            let statusMatch = true;

            let priorityMatch = true;


            if (
                statusFilter !== "all"
            ) {

                if (statusFilter === "pending") {
                    statusMatch =
                        status.includes("pending") ||
                        status.includes("submitted") ||
                        status.includes("disputed");
                }
                else if (statusFilter === "progress") {

                    statusMatch =
                        status.includes(
                            "progress"
                        ) ||
                        status.includes(
                            "assigned"
                        ) ||
                        status.includes("complete");

                }
                else if (statusFilter === "resolved") {

                    statusMatch =
                        status.includes("resolved") ||
                        status.includes("closed") ||
                        status.includes("citizen_verified");

                }

                else {

                    statusMatch =
                        status.includes(
                            statusFilter
                        );

                }

            }


            if (
                priorityFilter !== "all"
            ) {

                priorityMatch =
                    priority.includes(
                        priorityFilter
                    );

            }


            if (
                searchMatch &&
                statusMatch &&
                priorityMatch
            ) {

                row.style.display = "";

            }

            else {

                row.style.display = "none";

            }

        }
    );

}


// ==========================================
// REPORTS
// ==========================================

function updateReports(
    complaints
) {

    let pending = 0;

    let resolved = 0;


    complaints.forEach(
        function(complaint) {

            const status =
                String(
                    getStatus(complaint)
                ).toLowerCase();


            if (
                status.includes("pending") ||
                status.includes("submitted") ||
                status.includes("disputed")
            ) {

                pending++;

            }


            if (
                status.includes("resolved") ||
                status.includes("closed") ||
                status.includes("citizen_verified")
            ) {

                resolved++;

            }

        }
    );


    document.getElementById(
        "reportTotal"
    ).textContent =
        complaints.length;


    document.getElementById(
        "reportPending"
    ).textContent =
        pending;


    document.getElementById(
        "reportResolved"
    ).textContent =
        resolved;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent = value;


    return div.innerHTML;

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem(
        "access_token"
    );


    localStorage.removeItem(
        "authority_login"
    );


    window.location.href =
        "../AUTHO-login/authority-login.html";

}


// ==========================================
// SHOW LOGGED-IN USER
// ==========================================

function showUser() {

    const login =
        localStorage.getItem(
            "authority_login"
        );


    const emailElement =
        document.getElementById(
            "authorityEmail"
        );


    if (
        login &&
        emailElement
    ) {

        emailElement.textContent =
            login;

    }

}


// ==========================================
// START DASHBOARD
// ==========================================

showUser();

loadComplaints();