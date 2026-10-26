# John Charles Sarwi — Developer Portfolio

A responsive developer portfolio with live GitHub repository discovery and recent public activity.

**Website:** https://john-charles-sarwi-portfolio.vercel.app/  
**GitHub:** https://github.com/johncharlessarwi-dot

## Features
- Responsive, premium dark interface with mobile navigation.
- Live GitHub profile statistics and public repository discovery.
- Featured projects with live demo links where available.
- Search and category filters.
- Recent public GitHub events (pushes, repository creation, pull requests, releases).
- SEO metadata and accessible reduced-motion support.
- Static hosting; no database, API key or private credential required.

## Stack
HTML, CSS, vanilla JavaScript, GitHub REST API.

## Run locally
Open `index.html` or run `python -m http.server 8000`.

## GitHub data
Uses public endpoints for `/users/johncharlessarwi-dot`, public repositories and public events. GitHub applies unauthenticated rate limits. Private repositories and private activity are never exposed.

## Add featured projects
Edit the `featured` array in `app.js`. All remaining public repositories are discovered automatically.

© John Charles Sarwi