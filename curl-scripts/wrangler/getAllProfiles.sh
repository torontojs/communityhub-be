#!/bin/bash

# Run the Wrangler D1 query
wrangler d1 execute vms-local-db --local --command "SELECT * FROM profile"
