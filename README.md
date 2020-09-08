# Canvas Page View
This project downloads the page views for specified Canvas users and outputs a CSV for each user with the following headers:
* 'id'
* 'app_name'
* 'url'
* 'context_type'
* 'asset_type'
* 'controller'
* 'interaction_seconds'
* 'created_at'
* 'user_request'
* 'render_time'
* 'user_agent'
* 'participated'
* 'http_method'
* 'remote_ip'
* 'links'

An explanation of what these headers mean can be found here: https://canvas.instructure.com/doc/api/users.html#PageView

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for use with your own API tokens and Canvas domains.

### Prerequisites

1. **Install [Node 10 or greater](https://nodejs.org)**.
2. **Install [Git](https://git-scm.com/downloads)**.

### Installation and execution of script

1. Clone this repo. `git clone https://github.com/ubccapico/canvas-page-view`
1. Then cd into the repo. `cd canvas-page-view`
1. Run the installation script. `npm install` (If you see `babel-node: command not found`, you've missed this step.)
1. Generate Canvas API token and copy it to clipboard.
1. Rename the `sample.env` file to `.env`, and add your API token to `CANVAS_API_TOKEN=`.
1. Add your Canvas user IDs to `index.js`, as well as the start time and end time, where it says: `getPageViewsForUsers([/* add Canvas user IDs */], /* add start date */, /* add end date */)`
1. The start and end times should be specified in UTC time like this: `2020-05-18T00:00:00Z`
1. Run the script. `npm start`.
1. An `{Canvas id}-pageviews.csv` file should be generated for each Canvas user id.

## Authors

* [justin0022](https://github.com/justin0022) -
**Justin Lee** &lt;justin.lee@ubc.ca&gt;

## License

This project is licensed under the GNU General Public License v3.0.
