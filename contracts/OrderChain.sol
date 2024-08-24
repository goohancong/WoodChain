// contracts/OrderChain.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OrderChain {
    enum Status { Pending, Confirmed }

    struct Order {
        uint orderID;
        address user;
        uint supplierID;
        uint date;
        uint deliveryDate;
        uint totalPrice;
        Status status;
    }

    struct OrderDetail {
        uint orderID;
        uint productID;
        string productName;
        string productDescription;
        uint quantity;
        uint price;
    }

    mapping(uint => Order) public orders;
    mapping(uint => OrderDetail[]) public orderDetails;
    uint public nextOrderID = 1;

    event OrderPlaced(uint orderID, address user, uint supplierID, uint totalPrice);
    event OrderStatusUpdated(uint orderID, Status status);

    function placeOrder(
        uint _supplierID,
        uint _deliveryDate,
        uint _totalPrice,
        OrderDetail[] calldata _orderDetails
    ) external {
        orders[nextOrderID] = Order({
            orderID: nextOrderID,
            user: msg.sender,
            supplierID: _supplierID,
            date: block.timestamp,
            deliveryDate: _deliveryDate,
            totalPrice: _totalPrice,
            status: Status.Pending
        });

        for (uint i = 0; i < _orderDetails.length; i++) {
            orderDetails[nextOrderID].push(_orderDetails[i]);
        }

        emit OrderPlaced(nextOrderID, msg.sender, _supplierID, _totalPrice);
        nextOrderID++;
    }

    function updateOrderStatus(uint _orderID, Status _status) external {
        require(_orderID > 0 && _orderID < nextOrderID, "Invalid order ID");
        Order storage order = orders[_orderID];
        require(order.user == msg.sender, "Only the user who placed the order can update its status");

        order.status = _status;
        emit OrderStatusUpdated(_orderID, _status);
    }

    function getOrder(uint _orderID) external view returns (Order memory) {
        require(_orderID > 0 && _orderID < nextOrderID, "Invalid order ID");
        return orders[_orderID];
    }

    function getOrderDetails(uint _orderID) external view returns (OrderDetail[] memory) {
        require(_orderID > 0 && _orderID < nextOrderID, "Invalid order ID");
        return orderDetails[_orderID];
    }
}


