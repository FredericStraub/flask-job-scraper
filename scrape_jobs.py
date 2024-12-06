# scrape_jobs.py

import csv
import os
from jobspy import scrape_jobs as jobspy_scrape_jobs
import pandas as pd

def scrape_jobs(
    site_name=None,
    search_term='',
    google_search_term='',
    location='',
    distance=50,
    job_type='',
    proxies=None,
    is_remote=False,
    results_wanted=100,
    easy_apply=False,
    description_format='markdown',
    offset=0,
    hours_old=None,
    verbose=2,
    linkedin_fetch_description=False,
    linkedin_company_ids=None,
    country_indeed='',
    enforce_annual_salary=False,
    ca_cert=None
):
    """
    Scrape jobs using the jobspy library with the provided parameters and save to 'static/jobs.csv'.
    """
    csv_path = "static/jobs.csv"

    # Delete the existing CSV file if it exists
    if os.path.exists(csv_path):
        try:
            os.remove(csv_path)
            print(f"Deleted existing file: {csv_path}")
        except Exception as e:
            print(f"Error deleting file {csv_path}: {e}")
            # Continue even if deletion fails

    # Call the jobspy scrape_jobs function with provided parameters
    try:
        jobs = jobspy_scrape_jobs(
            site_name=site_name,
            search_term=search_term,
            google_search_term=google_search_term,
            location=location,
            distance=distance,
            job_type=job_type,
            proxies=proxies,
            is_remote=is_remote,
            results_wanted=results_wanted,
            easy_apply=easy_apply,
            description_format=description_format,
            offset=offset,
            hours_old=hours_old,
            verbose=verbose,
            linkedin_fetch_description=linkedin_fetch_description,
            linkedin_company_ids=linkedin_company_ids,
            country_indeed=country_indeed,
            enforce_annual_salary=enforce_annual_salary,
            ca_cert=ca_cert
        )
    except Exception as e:
        print(f"Error during scraping: {e}")
        raise e

    print(f"Found {len(jobs)} jobs")
    print(jobs.head())

    # Ensure that 'job_url' exists
    if 'job_url' not in jobs.columns:
        print("Error: 'job_url' column not found in scraped data.")
        raise ValueError("'job_url' column is missing.")

    # Save the jobs DataFrame to 'static/jobs.csv'
    try:
        jobs.to_csv(
            csv_path,
            quoting=csv.QUOTE_NONNUMERIC,
            escapechar="\\",
            index=False
        )
        print(f"Saved new jobs to {csv_path}")
    except Exception as e:
        print(f"Error saving CSV: {e}")
        raise e