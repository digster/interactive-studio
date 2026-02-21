"""
Dash example project for Interactive Studio.
Run this file from the editor to launch a local Dash server in the preview pane.
"""

import os

from dash import Dash, dcc, html


app = Dash(__name__)

months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
sales = [42, 58, 65, 71, 88, 97]
returns = [7, 6, 5, 5, 4, 3]

app.layout = html.Div(
    style={
        "maxWidth": "900px",
        "margin": "32px auto",
        "padding": "0 16px",
        "fontFamily": "Inter, system-ui, sans-serif",
    },
    children=[
        html.H1("Interactive Studio Dash Demo"),
        html.P("Sales and returns trend for the first half of the year."),
        dcc.Graph(
            figure={
                "data": [
                    {
                        "x": months,
                        "y": sales,
                        "name": "Sales",
                        "type": "bar",
                        "marker": {"color": "#2f7dd1"},
                    },
                    {
                        "x": months,
                        "y": returns,
                        "name": "Returns",
                        "type": "line",
                        "mode": "lines+markers",
                        "line": {"color": "#d9514e", "width": 3},
                    },
                ],
                "layout": {
                    "title": "Monthly KPI Snapshot",
                    "template": "plotly_white",
                    "legend": {"orientation": "h", "y": 1.1},
                },
            }
        ),
    ],
)


if __name__ == "__main__":
    host = os.environ.get("DASH_HOST", "127.0.0.1")
    port = int(os.environ.get("DASH_PORT", "8050"))
    print(f"Starting Dash server on http://{host}:{port}/")
    app.run(host=host, port=port, debug=False)
