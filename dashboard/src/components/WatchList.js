import React, { useContext, useMemo, useState } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Grow from "@mui/material/Grow";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import Close from "@mui/icons-material/Close";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import Search from "@mui/icons-material/Search";

import GeneralContext from "./GeneralContext";
import { watchlist } from "../data/data";
import { DoughnutChart } from "./DoughnoutChart";

const labels = watchlist.map((subArray) => subArray["name"]);

const WatchList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWatchlist = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return watchlist;
    }

    return watchlist.filter((stock) =>
      stock.name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: watchlist.map((stock) => stock.price),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // const data = {
  //   labels: filteredWatchlist.map((stock) => stock.name),
  // datasets: [
  //   {
  //     label: "Price",
  //     data: filteredWatchlist.map((stock) => stock.price),
  //     backgroundColor: [
  //       "rgba(255, 99, 132, 0.5)",
  //       "rgba(54, 162, 235, 0.5)",
  //       "rgba(255, 206, 86, 0.5)",
  //       "rgba(75, 192, 192, 0.5)",
  //       "rgba(153, 102, 255, 0.5)",
  //       "rgba(255, 159, 64, 0.5)",
  //     ],
  //     borderColor: [
  //       "rgba(255, 99, 132, 1)",
  //       "rgba(54, 162, 235, 1)",
  //       "rgba(255, 206, 86, 1)",
  //       "rgba(75, 192, 192, 1)",
  //       "rgba(153, 102, 255, 1)",
  //       "rgba(255, 159, 64, 1)",
  //     ],
  //     borderWidth: 1,
  //   },
  // ],
  // };

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search stocks"
            className="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <IconButton
              className="search-clear"
              size="small"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <Close fontSize="small" />
            </IconButton>
          ) : null}
        </div>
        <span className="counts">
          {filteredWatchlist.length} / {watchlist.length}
        </span>
      </div>

      <ul className="list">
        {filteredWatchlist.map((stock, index) => {
          return <WatchListItem stock={stock} key={index} />;
        })}
      </ul>

      <DoughnutChart data={data} />
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock }) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);

  const handleMouseEnter = () => {
    setShowWatchlistActions(true);
  };

  const handleMouseLeave = () => {
    setShowWatchlistActions(false);
  };

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.percent}</span>
          <span className={stock.isDown ? "down" : "up"}>
            {stock.isDown ? "▼" : "▲"}
          </span>
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.name} />}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const generalContext = useContext(GeneralContext);

  const handleBuyClick = () => {
    generalContext.openBuyWindow(uid);
  };

  return (
    <span className="actions">
      <span>
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <IconButton className="buy action-btn" onClick={handleBuyClick}>
            Buy
          </IconButton>
        </Tooltip>
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <IconButton className="sell action-btn">Sell</IconButton>
        </Tooltip>
        <Tooltip
          title="Analytics (A)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <IconButton className="action action-btn" title="Analytics (A)">
            <BarChartOutlined className="icon" />
          </IconButton>
        </Tooltip>
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
          <IconButton className="action action-btn" title="More">
            <MoreHoriz className="icon" />
          </IconButton>
        </Tooltip>
      </span>
    </span>
  );
};
