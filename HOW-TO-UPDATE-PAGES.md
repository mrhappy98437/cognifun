# How to Update Cognifun Website Pages

This document records the working method for updating the local Cognifun Publishing website.

## Core design rule

The website is built as a desktop-style publishing window. New content must fit inside the existing window. Do not redesign the outer site when adding page content.

Preserve:

- The outer window and its proportions
- The cream grid background
- The top navigation
- The bottom dock
- The existing typography and general visual character
- The internal scrolling behaviour

The content inside the window can become richer through carefully arranged boxes, cards, text columns, and restrained colour accents.

## Main page files

The canonical page files are in `pages/`:

- `pages/about.html`
- `pages/books.html`
- `pages/order.html`
- `pages/learning.html`
- `pages/courses.html`
- `pages/contact.html`

The root files such as `about.html`, `books.html`, and `learning.html` are redirect shortcuts. They normally do not need editing.

## Shared layout file

`ui/css/site.css` controls the shared visual system and page layouts, including:

- Window sizing and scrolling
- Navigation and dock positioning
- Typography
- Page spacing
- Content boxes and cards
- Responsive behaviour
- Colour accents and shadows

Change this file only when a page needs new layout or styling rules. Prefer page-specific class names so changes do not unintentionally affect other pages.

## JavaScript and shared partials

`ui/js/site.js` loads the shared menu and dock and manages shared page behaviour. `partials/menu.html` and `partials/dock.html` control the navigation and dock.

Do not edit these for ordinary page copy or page-specific boxes. The Contact link is an exception: its mailto destination is defined in both shared partials.

Static text boxes and internal scrolling do not require JavaScript.

## Current About Us work

The About Us page is being developed inside `pages/about.html`.

The current local prototype uses:

- A text-led opening area
- A photo/graphic placeholder
- An Our Belief box
- What We Make
- Why We Make It
- Our Approach
- Who It Is For
- A book graphic placeholder

The photo, book graphic, and any future icons remain placeholders until suitable assets are created. New images should be added as separate assets rather than replacing unrelated site images.

## Working method for new pages

1. Inspect the existing page and its current layout.
2. Identify the source wording available in older website versions.
3. Design the box structure with placeholder text first.
4. Keep the structure inside the existing window and test internal scrolling.
5. Add the edited page copy to the relevant boxes.
6. Add custom graphics only after the box dimensions are settled.
7. Check desktop and mobile layout.
8. Review the local result before considering any Git action.

## Git and publishing rule

All work remains local during design and review. Do not commit or push to GitHub unless Nicholas explicitly approves that action.

## Page planning status

- About Us: actively designed with a local text-and-box prototype.
- Book Gallery: already has a workable visual structure; review or improve its wording without redesigning the page unless a specific problem appears.
- Learning Resources: locally designed with a magazine-style layout and image placeholders.
- Order Books: needs confirmed purchasing details before final copy.
- Courses: locally designed with three proposed courses and five modules per course.
- Contact: top navigation and dock now open `mailto:cognifunlearning@gmail.com`; a form can be added later if needed.
