sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"zpmchecklist/model/models",
	"zpmchecklist/model/formatter"
], function (Controller, models, formatter) {
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
				displayMode: false,
				// changeMode: false,
				aufnr: "",
				chkno: ""
			}
			const oDisplayModel = models.createJSONModel(oViewParam);
			this.getView().setModel(oDisplayModel, "displayModel");

			const oStatus = {
				cstat: [{ key: "N", text: "New" }, { key: "A", text: "Approved" }],
			}
			const oStatusModel = models.createJSONModel(oStatus);
			this.getView().setModel(oStatusModel, "statusModel");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("main").attachMatched(this._onRouteMatched, this);
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

		onClearDateRange: function () {
			let oDateRange = this.byId("date-range0");
			if (oDateRange) {
				oDateRange.setValue("");
				oDateRange.setDateValue(null);
				oDateRange.setSecondDateValue(null);
			}
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
					// oModel.setProperty("/changeMode", false);
					oModel.setProperty("/displayMode", false);
				} else {
					oModel.setProperty("/createMode", false);
					oModel.setProperty("/displayMode", true);
					// if (oOrder.stat = 'I0002') {
					// 	oModel.setProperty("/changeMode", true);
					// 	oModel.setProperty("/displayMode", false);
					// } else {
					// 	oModel.setProperty("/changeMode", false);
					// 	oModel.setProperty("/displayMode", true);
					// }
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

				var oControl = oFilterItem.getControl();
				var sControlName = oControl.getMetadata().getName();
				var oFieldData = [];

				if (sControlName == "sap.m.MultiComboBox") {
					oFieldData = oControl.getSelectedKeys();
				} else if (sControlName == "sap.m.ComboBox") {
					oFieldData.push(oControl.getSelectedKey());
				} else if (sControlName == "sap.m.MultiInput") {
					var oTokens = oControl.getTokens();
					var oFieldData = oTokens.map(function (oTokenItem) {
						return oTokenItem.getKey();
					});
				} else if (sControlName == "sap.m.DateRangeSelection") {
					oFieldData.push(oControl.getDateValue());
					oFieldData.push(oControl.getSecondDateValue());
				} else if (sControlName == "sap.m.DatePicker") {
					oFieldData.push(oControl.getDateValue());
				}

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
				// oControl.setSelectedKeys(oData.fieldData);
				var sControlName = oControl.getMetadata().getName();

				if (sControlName == "sap.m.DateRangeSelection") {
					oControl.setDateValue(oDataObject.fieldData[0]);
					oControl.setSecondDateValue(oDataObject.fieldData[1]);
				} else if (sControlName == "sap.m.DatePicker") {
					oControl.setDateValue(oDataObject.fieldData[0]);
				} else if (sControlName == "sap.m.ComboBox") {
					oControl.setSelectedKey(oDataObject.fieldData[0])
				} else if (sControlName == "sap.m.MultiInput") {
					oControl.setTokens(oDataObject.fieldData)
				} else {   // if (sControlName == "sap.m.MultiComboBox") {
					oControl.setSelectedKeys(oDataObject.fieldData);
				}
			}, this);
		},

		getFiltersWithValue: function () {
			var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();
				var sControlName = oControl.getMetadata().getName();

				// if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
				// 	aResult.push(oFilterGroupItem);
				// }

				if (oControl) {
					if (sControlName == "sap.m.DateRangeSelection" || sControlName == "sap.m.DatePicker") {
						aResult.push(oFilterGroupItem);
					} else if (sControlName == "sap.m.MultiComboBox" && oControl.getSelectedKeys().length > 0) {
						aResult.push(oFilterGroupItem);
					} else if (sControlName == "sap.m.ComboBox" && oControl.getSelectedKey()) {
						aResult.push(oFilterGroupItem);
					} else if (sControlName == "sap.m.MultiInput" && oControl.getTokens().length > 0) {
						aResult.push(oFilterGroupItem);
					}
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
				var sControlName = oControl.getMetadata().getName();
				var aSelectedKeys = [];
				var aFilters = [];

				// var aFilters = aSelectedKeys.map(function (sSelectedKey) {
				// 	return new sap.ui.model.Filter({
				// 		path: oFilterGroupItem.getName(),
				// 		operator: sap.ui.model.FilterOperator.Contains,
				// 		value1: sSelectedKey
				// 	});
				// });

				if (sControlName == "sap.m.DateRangeSelection") {
					var oDateFrom = oControl.getDateValue();
					if (oDateFrom) {
						var oDateTo = oControl.getSecondDateValue();
						aFilters.push(new sap.ui.model.Filter({
							path: oFilterGroupItem.getName(),
							operator: sap.ui.model.FilterOperator.BT,
							value1: oDateFrom.toISOString().split("T")[0],  //.split("-").join(""),
							value2: oDateTo.toISOString().split("T")[0]   //.split("-").join("")
						}))
					};
				} else if (sControlName == "sap.m.DatePicker") {
					var sPerio = oControl.getValue();
					if (sPerio) {
						aFilters.push(new sap.ui.model.Filter({
							path: oFilterGroupItem.getName(),
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sPerio.split("-").join("")
						}))
					};
				} else if (sControlName == "sap.m.ComboBox") {
					aSelectedKeys.push(oControl.getSelectedKey());
					aFilters = aSelectedKeys.map(function (sSelectedKey) {
						return new sap.ui.model.Filter({
							path: oFilterGroupItem.getName(),
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sSelectedKey
						});
					});
				} else if (sControlName == "sap.m.MultiInput") {
					var aTokens = oControl.getTokens();
					aFilters = aTokens.map(function (oToken) {
						if (oToken.data("range")) {
							var oRange = oToken.data("range");
							return new sap.ui.model.Filter({
								path: oFilterGroupItem.getName(),
								operator: oRange.exclude ? "NE" : oRange.operation,
								value1: oRange.value1,
								value2: oRange.value2
							});
						} else {
							return new sap.ui.model.Filter({
								path: oFilterGroupItem.getName(),
								operator: sap.ui.model.FilterOperator.EQ,
								value1: oToken.getKey()
							});
						}
					})
				} else {
					aSelectedKeys = oControl.getSelectedKeys();
					aFilters = aSelectedKeys.map(function (sSelectedKey) {
						return new sap.ui.model.Filter({
							path: oFilterGroupItem.getName(),
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sSelectedKey
						});
					});
				}

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
		},

		_onRouteMatched: function (oEvent) {
			// var oArgs = oEvent.getParameter("arguments");
			// var sAufnr = oArgs.aufnr;
			const oModel = this.getView().getModel("pmOrderService");
			if (oModel) {
				if (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel") {
					oModel.refresh(true);
				}
			}

			const displayModel = this.getView().getModel("displayModel");
			displayModel.setProperty("/createMode", false);
			displayModel.setProperty("/displayMode", false);
			// displayModel.setProperty("/changeMode", false);
			displayModel.setProperty("/aufnr", "");
			displayModel.setProperty("/chkno", "");

			const oTable = this.byId("ordertable01");
			oTable.removeSelections();
		},

		formatter: formatter
	});
});
