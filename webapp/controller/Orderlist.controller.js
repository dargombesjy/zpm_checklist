sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"zpmchecklist/model/models"
], function (Controller, models) {
	"use strict";

	return Controller.extend("sap.ui.comp.sample.smarttable.SmartTable", {
		onInit: function () {
			this.fetchData = this.fetchData.bind(this);
			this.applyData = this.applyData.bind(this);
			this.getFiltersWithValue = this.getFiltersWithValue.bind(this);

			this.oFilterBar = this.getView().byId("filterbar01");
			this.oTable = this.getView().byId("ordertable01");

			this.oFilterBar.registerFetchData(this.fetchData);
			this.oFilterBar.registerApplyData(this.applyData);
			this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValue);

			const oViewParam = {
				createMode: false,
				displayMode: true,
				changeMode: false,
				aufnr: "",
				chkno: ""
			}
			const oDisplayModel = models.createJSONModel(oViewParam);
			this.getView().setModel(oDisplayModel, "displayModel");
		},

		onExit: function () {
			this.oFilterBar = null;
			this.oTable = null;
		},

		onCreate: function () {
			// var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			const sParam = this._getRouteProperty("aufnr");
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("create", {
				aufnr: sParam
			});
		},

		onDisplay: function () {
			const sParam = this._getRouteProperty("aufnr");
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail", {
				aufnr: sParam
			});
		},

		onChange: function () {
			const sParam = this._getRouteProperty("aufnr");
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail", {
				aufnr: sParam
			});
		},

		onTableSelectionChange: function (oEvent) {
			const oSelectedItem = oEvent.getParameter("listItem");
			if (oSelectedItem) {
				const oModel = this.getView().getModel("displayModel");
				let oBindingContext = oSelectedItem.getBindingContext("pmOrderService");
				let oOrder = oBindingContext.getObject();
				oModel.setProperty("/aufnr", oOrder.aufnr);
				oModel.setProperty("/chkno", oOrder.chkno);
				if (!oOrder.chkno) {
					oModel.setProperty("/createMode", true);
					oModel.setProperty("/changeMode", false);
					oModel.setProperty("/displayMode", false);
				} else {
					oModel.setProperty("/createMode", false);
					if (oOrder.stat = 'I0002') {
						oModel.setProperty("/changeMode", true);
						oModel.setProperty("/displayMode", false);
					} else {
						oModel.setProperty("/changeMode", false);
						oModel.setProperty("/displayMode", true);
					}
				}
			}
		},

		_getRouteProperty: function (sProp) {
			const oModel = this.getView().getModel("displayModel");
			const sPath = "/" + sProp;
			const sParam = oModel.getProperty(sPath);
			return sParam;
		},

		fetchData: function () {
			var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
				aResult.push({
					groupName: oFilterItem.getGroupName(),
					fieldName: oFilterItem.getName(),
					fieldData: oFilterItem.getControl().getSelectedKeys()
				});
				return aResult;
			}, []);
			return aData;
		},

		applyData: function (aData) {
			aData.forEach(function (oData) {
				var oControl = this.oFilterBar.determineControlByName(oData.fieldName, oData.groupName);
				oControl.setSelectedKeys(oData.fieldData);
			}, this);
		},

		getFiltersWithValue: function () {
			var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();
				if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
					aResult.push(oFilterGroupItem);
				}
				return aResult;
			}, []);
			return aFiltersWithValue;
		},

		onFilterSelectionChange: function (oEvent) {
			this.oFilterBar.fireFilterChange(oEvent);
		},

		onFilterBarChange: function () {
			this._updateLabelsAndTable();
		},

		onSearch: function () {
			var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();
				var aSelectedKeys = oControl.getSelectedKeys();
				var aFilters = aSelectedKeys.map(function (sSelectedKey) {
					return new sap.ui.model.Filter({
						path: oFilterGroupItem.getName(),
						operator: sap.ui.model.FilterOperator.Contains,
						value1: sSelectedKey
					});
				});

				if (aFilters.length > 0) {
					aResult.push(new sap.ui.model.Filter({
						filters: aFilters,
						and: false
					}));
				}

				return aResult;
			}, []);
			this.oTable.getBinding("items").filter(aTableFilters);
			this.oTable.setShowOverlay(false);
		},

		_updateLabelsAndTable: function () {
			this.oTable.setShowOverlay(true);
		}

	});
});
