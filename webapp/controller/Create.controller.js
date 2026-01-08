sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models"
], function (BusyIndicator, BaseController, models) {
    "use strict";

    return BaseController.extend("zpmchecklist.controller.Create", {
        onInit: function () {
            // this.onFileChange = this.onFileChange.bind(this);
            // this.onAddLeaderPress = this.onAddLeaderPress.bind(this);
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("create").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const oViewData = {
                list: [{ key: "Y", text: "Y" }, { key: "N", text: "N" }],
                aufnr: oArgs.aufnr,
                isNew: true,
                allowEdit: true,
                viewMode: "create"
            };
            const oJsonModel = models.createJSONModelOne(oViewData);
            this.getView().setModel(oJsonModel, "oViewModel");

            const oChecklistData = {
                aufnr: oViewData.aufnr,
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                gstri: null,
                gltri: null,
                loekz: "",
                IsActiveEntity: true,
                to_Item: [],
                to_Partner: {
                    results: [],
                },
                to_Approver: {
                    results: [],
                },
                to_Attachment: {
                    results: []
                }
            }

            for (let i = 0; i < 20; i++) {
                let itemno = i + 1;
                oChecklistData.to_Partner.results.push({
                    chkid: "",
                    chkno: "",
                    aufnr: "",
                    itemno: itemno,
                    bp_id: "",
                    bp_name: "",
                    bp_func: "",
                    bp_position: "leader",
                    loekz: "X"
                });
            }

            for (let i = 0; i < 3; i++) {
                oChecklistData.to_Attachment.results.push({
                    chkid: "",
                    chkno: "",
                    aufnr: oViewData.aufnr,
                    itemno: i.toString(),
                    att_type: "",
                    obj_type: "BUS2007",   //PMAUFK
                    att_url: "",
                    att_bin: ""
                });
            }

            for (let i = 0; i < 3; i++) {
                let itemno = i + 1;
                oChecklistData.to_Approver.results.push({
                    aufnr: oViewData.aufnr,
                    itemno: itemno.toString(),
                    bp_id: "",
                    bp_name: "",
                    bp_func: "",
                    bp_position: "",
                    nik: "",
                    pms: "",
                    prs: ""
                });
            }

            const oCmb1 = this.byId("approver1-cmb");
            if (oCmb1) {
                oCmb1.getBinding("items").refresh();
            }
            const oCmb2 = this.byId("approver2-cmb");
            if (oCmb2) {
                oCmb2.getBinding("items").refresh();
            }
            const oCmb3 = this.byId("approver3-cmb");
            if (oCmb3) {
                oCmb3.getBinding("items").refresh();
            }

            const oChecklistModel = models.createJSONModel(oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");

            this._buildContent();
        },

        _buildContent: async function () {
            // const oComponent = this.getOwnerComponent();
            const oView = this.getView();
            const oModel = oView.getModel();
            const oViewModel = oView.getModel("oViewModel");
            const sAufnr = oViewModel.getProperty("/aufnr");

            const that = this;
            // try {
            const oDataHeader = await new Promise(function (resolve, reject) {
                oModel.read("/ViewHeaderSet(ingpr='',aufnr='" + sAufnr + "')", {
                    urlParameters: {
                        "$expand": "toColumn"
                    },
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        var sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageBox.show(sErrorMessage, {
                            icon: sap.m.MessageBox.Icon.ERROR,
                            title: "Validation Error",
                            actions: [sap.m.MessageBox.Action.OK],
                            onClose: function () {
                                that.onBack();
                            }
                        });
                        // reject(oError);
                    }
                });
            });

            this._oChecklistHeader = oDataHeader;
            const oChecklistHeaderModel = models.createJSONModel(oDataHeader);
            this.getView().setModel(oChecklistHeaderModel, "oChecklistHeaderModel");

            BusyIndicator.show(10);
            const oDataItems = await new Promise(function (resolve, reject) {
                oModel.read("/ViewItemSet", {
                    filters: [
                        new sap.ui.model.Filter("aufnr", sap.ui.model.FilterOperator.EQ, sAufnr)
                    ],
                    success: function (oData) {
                        resolve(oData.results);
                        BusyIndicator.hide();
                    },
                    error: function (oError) {
                        reject(oError);
                        BusyIndicator.hide();
                    }
                });
            });

            oDataItems.sort(function (a, b) {
                return a.vornr - b.vornr;
            });

            this._buildCreateModel(oDataItems);
            this._setupPage(oDataItems);

            const oTable = this.getView().byId("table01");
            oTable.bindAggregation("rows", "oNewRowModel>/", this._buildRow.bind(this)); // function (sId, oContext) {
        },

        _setupPage: function (oData) {
            const oTableContainer = this.getView().byId("tableContainer");
            this._buildTable(oData, oTableContainer);
        },

        onCreate: function () {
            this._createChecklist();
        },

        onCancel: function () {
            this.byId("cancelButton").setVisible(false);
            this.byId("editButton").setVisible(true);
        },

        // Implement checklist creation logic here
        _createChecklist: function () {
            const oModel = this.getOwnerComponent().getModel();
            const oView = this.getView();
            const oViewModel = oView.getModel("oViewModel");
            const oChecklistModel = oView.getModel("oChecklistModel");

            if (this._validateOnSave(oChecklistModel) != "S") return;

            const oNewChecklist = {
                aufnr: oViewModel.getProperty("/aufnr"),
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                gstri: oChecklistModel.getProperty("/gstri"),
                gltri: oChecklistModel.getProperty("/gltri"),
                // loekz: oChecklistModel.loekz,
                IsActiveEntity: true
            };
            oNewChecklist.to_Item = [];
            oNewChecklist.to_Partner = [];
            oNewChecklist.to_Approver = [];
            oNewChecklist.to_Attachment = [];

            let itemPos = 0;
            const oNewRowModel = this.getView().getModel("oNewRowModel");
            for (let oRowData of oNewRowModel.getData()) {
                itemPos += 1;
                let itemNumber = 0;
                for (let row in oRowData.values) {
                // for (let row in oRowData.values.filter(el => ["lower_limmit", "upper_limit", "recdv"].contains(el))) {
                    if (row != "remark" && row != "lower_limit" && row != "upper_limit" && row != "recdv") {
                    // if (row != "remark") {
                        if (oRowData.values[row].sval == "") {
                            sap.m.MessageBox.error("kolom " + row + " pada '" + oRowData.cl_action + "' belum diisi");
                            return;
                        }
                        if (row == "mpoint" && oRowData.indct && oRowData.recdv != "") {
                            let nLast = parseFloat(oRowData.recdv.trim());
                            if (nLast != NaN && nLast >= oRowData.values[row].sval) {
                                sap.m.MessageBox.error("Measurement lebih kecil atau sama dengan sebelumnya");
                                return;
                            }
                        }
                    }
                    itemNumber += 1;
                    const oNewItem = {
                        aufpl: oRowData.aufpl,
                        aplzl: oRowData.aplzl,
                        itemno: itemNumber.toString().padStart(6, '0'),
                        itempos: itemPos.toString().padStart(6, '0'),
                        ref_mpoint: oRowData.ref_mpoint,
                        key_type: oRowData.key_type,
                        val_type: oRowData.val_type,
                        IsActiveEntity: true
                    };
                    oNewItem.keyname = row;
                    oNewItem.atwrt = oRowData.values[row].sval;
                    oNewChecklist.to_Item.push(oNewItem);
                }
            }

            let itemNumber = 0;
            for (let oPartner of oChecklistModel.getProperty("/to_Partner/results")) {
                itemNumber += 1;
                const oNewPartner = {
                    aufnr: oPartner.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    bp_id: oPartner.bp_id,
                    bp_name: oPartner.bp_name,
                    bp_func: oPartner.bp_func,
                    loekz: oPartner.loekz,
                    IsActiveEntity: true
                };
                oNewChecklist.to_Partner.push(oNewPartner);
            }

            itemNumber = 0;
            for (let oApprover of oChecklistModel.getProperty("/to_Approver/results")) {
                itemNumber += 1;
                // if (oApprover.bp_name) {
                const oNewApprover = {
                    aufnr: oApprover.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    bp_id: oApprover.bp_id,
                    bp_name: oApprover.bp_name,
                    bp_func: oApprover.bp_func,
                    nik: oApprover.nik,
                    pms: oApprover.pms,
                    prs: oApprover.prs,
                    IsActiveEntity: true
                };
                oNewChecklist.to_Approver.push(oNewApprover);
                // }
            }
            if (itemNumber <= 0) {
                sap.m.MessageBox.show("Approver tidak boleh kosong", {
                    icon: sap.m.MessageBox.Icon.ERROR,
                    title: "Validation Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            itemNumber = 0;
            for (let oAttachment of oChecklistModel.getProperty("/to_Attachment/results")) {
                itemNumber += 1;
                // if (oAttachment.att_url) {
                const oNewAttachment = {
                    aufnr: oAttachment.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    att_type: oAttachment.att_type,
                    obj_type: oAttachment.obj_type,
                    att_url: oAttachment.att_url,
                    att_bin: oAttachment.att_bin,
                    IsActiveEntity: true
                };
                oNewChecklist.to_Attachment.push(oNewAttachment);
                // }
            }

            const that = this;
            BusyIndicator.show(10);
            oModel.create("/ZC_PMChecklistHeader", oNewChecklist, {
                success: function (oData) {
                    BusyIndicator.hide();
                    that.getView().getModel("oViewModel").setProperty("/isNew", false);
                    sap.m.MessageBox.show("Checklist created successfully!", {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            that.onBack();
                        }
                    });
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    let sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                    if (!sErrorMessage) {
                        sErrorMessage = "Error creating checklist";
                    }
                    sap.m.MessageBox.error(sErrorMessage);
                }
            });
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            
            const oTable = this.getView().byId("table01");
            if (oTable) {
                oTable.destroyColumn();
                oTable.unbindAggregation("rows");
            }
            oRouter.navTo("main", {}, true);
        },

        _buildCreateModel: function (oDataItems) {
            let iItemPos = 0;
            let aRowModel = [];
            for (let taskData of oDataItems) {
                // start build json model for rows
                if (taskData.steus == 'INT1') {
                    // continue;
                }
                iItemPos += 1;
                let oRowObject = {
                    category: taskData.category,
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    vornr: taskData.vornr,
                    sumnr: taskData.sumnr,
                    steus: taskData.steus,
                    sub_category: taskData.sub_category,
                    cl_action: taskData.cl_action,
                    cl_method: taskData.cl_method,
                    ref_mpoint: taskData.ref_mpoint,
                    ref_image: taskData.ref_image,
                    column_list: taskData.column_list,
                    upper_limit: taskData.upper_limit,
                    lower_limit: taskData.lower_limit,
                    atawe: taskData.atawe,
                    indct: taskData.indct,
                    recdv: taskData.recdv,
                    isChanged: false,
                    values: {}
                };

                let skipForMpoint = false;
                for (let colData of this._oChecklistHeader.toColumn.results) {
                    if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                    if (colData.col_type == "L") continue;

                    let cellKey = colData.col_name;
                    if (colData.col_type == 'A') {
                        // oRowObject.values[cellKey] = "";
                        oRowObject.values[cellKey] = {
                            sval: "",
                            chitid: "",
                            itemno: "",
                            posted: ""
                        };
                    } else if (colData.col_type == "V") {
                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                // const aPoint = ["mpoint", "atawe", "upper_limit", "lower_limit"];
                                for (let index = 0; index < aVals.length; index++) {
                                    const el = aVals[index];
                                    // oRowObject.values[el] = taskData[el] || "";
                                    oRowObject.values[el] = {
                                        sval: taskData[el] || "",
                                        chitid: "",
                                        itemno: "",
                                        posted: ""
                                    };
                                    skipForMpoint = true;
                                }
                            }
                        }
                        if (!skipForMpoint && sFound) {
                            // oRowObject.values[cellKey] = "";
                            oRowObject.values[cellKey] = {
                                sval: "",
                                chitid: "",
                                itemno: "",
                                posted: ""
                            };
                        }
                    }
                }

                aRowModel.push(oRowObject);
            };
            const oNewRowModel = models.createJSONModel(aRowModel);
            oNewRowModel.setSizeLimit(this._jsonSizeLimit);
            this.getView().setModel(oNewRowModel, "oNewRowModel");
        }
    });
});