// static/script.js

document.addEventListener('DOMContentLoaded', function () {
    const scrapeForm = document.getElementById('scrape-form');
    const loadingIndicator = document.getElementById('loading');
    const jobsTableBody = document.querySelector('#jobs-table tbody');
    const downloadsList = document.getElementById('downloads-list');

    // Function to fetch and display jobs
    function fetchJobs() {
        Papa.parse('/static/jobs.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const jobs = results.data;
                populateTable(jobs);
            },
            error: function(err) {
                console.error('Error parsing CSV:', err);
            }
        });
    }

    // Function to populate the jobs table
    function populateTable(jobs) {
        jobsTableBody.innerHTML = ''; // Clear existing rows

        jobs.forEach(job => {
            const tr = document.createElement('tr');

            // Title with link
            const titleTd = document.createElement('td');
            const titleLink = document.createElement('a');
            console.log(`Job Title: ${job.title}, Job URL: ${job.job_url}`);
            titleLink.href = job.job_url || '#';
            titleLink.textContent = job.title;
            titleLink.target = '_blank';
            titleTd.appendChild(titleLink);
            tr.appendChild(titleTd);

            // Company with logo
            const companyTd = document.createElement('td');
            if (job.company_logo) {
                const logoImg = document.createElement('img');
                logoImg.src = job.company_logo;
                logoImg.alt = `${job.company} Logo`;
                logoImg.width = 30;
                logoImg.classList.add("mr-2");
                companyTd.appendChild(logoImg);
            }
            const companyLink = document.createElement('a');
            companyLink.href = job.company_url_direct || '#';
            companyLink.textContent = job.company;
            companyLink.target = '_blank';
            companyTd.appendChild(companyLink);
            tr.appendChild(companyTd);

            // Location
            const locationTd = document.createElement('td');
            locationTd.textContent = job.location;
            tr.appendChild(locationTd);

            // Date Posted
            const dateTd = document.createElement('td');
            dateTd.textContent = job.date_posted;
            tr.appendChild(dateTd);

            // Job Type
            const typeTd = document.createElement('td');
            typeTd.textContent = job.job_type;
            tr.appendChild(typeTd);

            // Salary
            const salaryTd = document.createElement('td');
            if (job.min_amount || job.max_amount) {
                let salaryText = '';
                if (job.min_amount && job.max_amount) {
                    salaryText = `${job.min_amount} - ${job.max_amount} ${job.currency}`;
                } else if (job.min_amount) {
                    salaryText = `From ${job.min_amount} ${job.currency}`;
                } else {
                    salaryText = `Up to ${job.max_amount} ${job.currency}`;
                }
                salaryTd.textContent = salaryText;
            } else {
                salaryTd.textContent = 'N/A';
            }
            tr.appendChild(salaryTd);

            // Description with toggle
            const descTd = document.createElement('td');
            const toggleSpan = document.createElement('span');
            toggleSpan.textContent = 'Show Description';
            toggleSpan.classList.add('description-toggle');
            toggleSpan.style.cursor = 'pointer';
            toggleSpan.style.color = '#007bff';
            toggleSpan.style.textDecoration = 'underline';

            const descContent = document.createElement('div');
            descContent.classList.add('description-content');
            descContent.style.display = 'none';
            descContent.textContent = job.description;

            toggleSpan.addEventListener('click', function() {
                if (descContent.style.display === 'none') {
                    descContent.style.display = 'block';
                    toggleSpan.textContent = 'Hide Description';
                } else {
                    descContent.style.display = 'none';
                    toggleSpan.textContent = 'Show Description';
                }
            });

            descTd.appendChild(toggleSpan);
            descTd.appendChild(descContent);
            tr.appendChild(descTd);

            jobsTableBody.appendChild(tr);
        });
    }

    // Initial fetch to display existing jobs
    fetchJobs();

    // Handle form submission
    scrapeForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Show loading indicator
        loadingIndicator.style.display = 'block';

        // Gather form data
        const formData = new FormData(scrapeForm);
        const data = {
            search_term: formData.get('search_term') || '',
            google_search_term: formData.get('google_search_term') || '',
            results_wanted: parseInt(formData.get('results_wanted')) || 100,
            hours_old: parseInt(formData.get('hours_old')) || 500,
            location: formData.get('location') || '',
            country_indeed: formData.get('country_indeed') || ''
        };

        console.log('Sending scrape request with data:', data);

        // Send POST request to /scrape
        fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(json => {
            if (json.status === "Scraping started") {
                console.log('Scraping started successfully.');

                // Add download link to downloads list
                const downloadUrl = '/download'; // Directly set to '/download'
                console.log('Setting downloadUrl to:', downloadUrl);

                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.textContent = 'Download CSV';
                link.classList.add('btn', 'btn-success', 'btn-sm');
                link.style.marginRight = '10px';
                link.style.pointerEvents = 'none'; // Disable until ready
                link.style.opacity = '0.6'; // Indicate disabled

                const statusSpan = document.createElement('span');
                statusSpan.textContent = 'Scraping in progress...';
                statusSpan.classList.add('text-muted');

                listItem.appendChild(link);
                listItem.appendChild(statusSpan);
                downloadsList.appendChild(listItem);

                // Start polling for this download
                pollScrapeStatus(downloadUrl, link, statusSpan);
            } else {
                console.error('Failed to start scraping:', json);
                throw new Error('Failed to start scraping.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingIndicator.style.display = 'none';
            alert('An error occurred while starting the scraping process.');
        });
    });

    // Function to poll for scraping completion for a specific download
    function pollScrapeStatus(downloadUrl, linkElement, statusElement) {
        const maxAttempts = 60; // e.g., 5 minutes
        let attempts = 0;
        const intervalTime = 5000; // 5 seconds

        const interval = setInterval(() => {
            attempts += 1;
            console.log(`Polling attempt ${attempts} for ${downloadUrl}`);

            fetch(downloadUrl, { method: 'HEAD' })
                .then(response => {
                    if (response.status === 200) {
                        // Scraping is complete, enable the download link
                        clearInterval(interval);
                        linkElement.style.pointerEvents = 'auto';
                        linkElement.style.opacity = '1';
                        linkElement.textContent = 'Download CSV';
                        statusElement.textContent = 'Scraping completed.';
                        console.log('Scraping completed. Download link enabled.');

                        // Optionally, refresh the jobs table
                        fetchJobs();

                        // Hide loading indicator
                        loadingIndicator.style.display = 'none';
                    }
                })
                .catch(err => {
                    // Scraping in progress or file not ready
                    console.log('Scraping still in progress...');
                });

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                linkElement.style.pointerEvents = 'none';
                linkElement.style.opacity = '0.6';
                linkElement.textContent = 'Download CSV';
                statusElement.textContent = 'Scraping timed out.';
                console.warn('Scraping timed out.');

                // Hide loading indicator
                loadingIndicator.style.display = 'none';
            }
        }, intervalTime);
    }

    // Toggle description visibility (for dynamically added elements)
    jobsTableBody.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('description-toggle')) {
            const descContent = e.target.nextElementSibling;
            if (descContent.style.display === 'none') {
                descContent.style.display = 'block';
                e.target.textContent = 'Hide Description';
            } else {
                descContent.style.display = 'none';
                e.target.textContent = 'Show Description';
            }
        }
    });
});