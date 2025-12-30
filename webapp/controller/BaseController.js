sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/mvc/Controller",
    "zpmchecklist/control/Table02",
    "zpmchecklist/model/validator",
    "zpmchecklist/model/formatter"
], function (BusyIndicator, Controller, Table02, validator, formatter) {  //, Column02, Row02, models) {
    "use strict";

    return Controller.extend("zpmchecklist.controller.BaseController", {
        _aColumns: [],
        _oChecklistHeader: {},
        // _oChecklistData: {},
        _aGroupHeader: [],
        _bLeaderChanged: false,
        _bApproverChanged: false,
        _bAttachmentChanged: false,
        _sMinWidth: "4.13rem",
        _sValueBoxMinWidth: "24.78rem",
        _nValueColumnCount: 1,
        _containsError: false,
        _jsonSizeLimit: 2000,
        _config: {},

        _buildTable: function (oData, oTableContainer) {
            // const oTableWrapper = new sap.m.VBox("tableWrapper", {
            //     width: "90%",
            //     layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
            // });

            const oTableWrapper = this.getView().byId("tableWrapper");
            const oTable = this.getView().byId("table01");

            // let tabCounter = 0;
            // tabCounter += 1;
            // const oTable = new Table02({
            //     id: "table0" + tabCounter,
            //     title: this._oChecklistHeader.cvname,
            //     showTitle: true
            // });

            this._oChecklistHeader.toColumn.results.sort(function (a, b) { return a.col_pos - b.col_pos });
            const oColumn = new sap.m.HBox({
                alignContent: "Stretch",
                justifyContent: "Start",
                items: []
            });
            const oColValueBox = new sap.m.HBox("colspan-container", {
                layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 0, shrinkFactor: 0 })]
            });

            this._aColumns = [];
            let valueColumnCount = 0;
            for (let colData of this._oChecklistHeader.toColumn.results) {
                if (!colData.col_type || colData.is_hidden == "X") continue;
                let flexGrow = parseFloat(colData.col_grow === "" ? 0 : colData.col_grow);
                let colBasis = colData.col_basis || "auto";

                if (colData.col_type == "V") {
                    if (colData.has_subcol == "X") {
                        this._oSubcol = new sap.m.HBox();
                        this._oSpancol = new sap.m.VBox("spancol-parent", {
                            width: "100%",
                            items: [
                                new sap.m.Text({
                                    width: "100%",
                                    text: colData.col_label,
                                    layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                }),
                                this._oSubcol
                            ],
                            // layoutData: [new sap.m.FlexItemData({ baseSize: "10%", growFactor: 1 })]
                        });
                        oColValueBox.addItem(this._oSpancol);
                    } else {
                        const colLabel = new sap.m.Text({
                            text: colData.col_label,
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, minWidth: this._sMinWidth, styleClass: "text-center" })]
                        });
                        if (colData.is_subcol == 'X') {
                            this._oSubcol.addItem(colLabel);
                            valueColumnCount += 1;
                            this._aColumns.push(colData);
                        } else {
                            oColValueBox.addItem(colLabel);
                            valueColumnCount += 1;
                            this._aColumns.push(colData);
                        }
                    }
                    oColumn.addItem(oColValueBox);
                } else {
                    const colLabel = new sap.m.Text({
                        text: colData.col_label,
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })]
                    });
                    oColumn.addItem(colLabel);
                    this._aColumns.push(colData);
                }
            }

            oTable.setColumn(oColumn);   // end set column
            this._nValueColumnCount = valueColumnCount;
            let nMinWidth = parseFloat(this._sMinWidth);
            let sValueBoxMinWidth = this._nValueColumnCount * nMinWidth;
            this._sValueBoxMinWidth = sValueBoxMinWidth.toString() + "rem";

            this._aColumns.sort(function (a, b) {
                return a.col_pos - b.col_pos;
            })

            this._aGroupHeader.sort(function (a, b) {
                return a.vornr - b.vornr;
            });

            oTableWrapper.addItem(oTable);
        },

        _buildRow: function (sId, oContext) {
            const oNewRowModel = this.getView().getModel("oNewRowModel");
            const oRow = new sap.m.HBox(sId, {
                alignContent: "Start",
                justifyContent: "Start",
                items: []
            });
            const oValueBox = new sap.m.HBox({
                layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 0, shrinkFactor: 0 })]
            });

            let oCell = {};
            let skipMpoint = false;
            let aVals = oContext.getProperty("column_list") ? oContext.getProperty("column_list").split(",").map(function (item) { return item.trim() }) : [];

            for (let col of this._aColumns) {
                let flexGrow = parseFloat(col.col_grow === "" ? 0 : col.col_grow);
                let flexShrink = parseFloat(col.col_shrink === "" ? 0 : col.col_shrink);
                let colBasis = col.col_basis || "auto";
                let cellKey = col.col_name;

                if (col.col_type == "L") {
                    oCell = new sap.m.Text({
                        text: "{oNewRowModel>" + col.col_name + "}",
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                    });
                    if (oContext.getProperty("steus") == "INT1") {
                        oRow.addStyleClass("group-header");
                    }
                    if (oContext.getProperty("ref_image") != "") {
                        const oCellwithImage = new sap.m.VBox({
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                        });
                        oCellwithImage.addItem(oCell);

                        const oImage = new sap.m.Image({
                            src: "{oNewRowModel>ref_image}", alt: "Reference Image",
                            height: "30px", densityAware: false, decorative: false,
                            // layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                            detailBox: new sap.m.LightBox({
                                imageContent: [new sap.m.LightBoxItem({
                                    imageSrc: "{oNewRowModel>ref_image}",
                                    title: "Referensi gambar"
                                })]
                            })
                        });
                        oCellwithImage.addItem(oImage);
                        oRow.addItem(oCellwithImage);
                    } else {
                        oRow.addItem(oCell);
                    }
                } else if (col.col_type == 'A') {
                    if (oContext.getProperty("steus") == "INT") {
                        oCell = new sap.m.TextArea({
                            value: "{oNewRowModel>values/" + cellKey + "/sval}",
                            placeholder: "Entry value..",
                            rows: 1,
                            width: "100%",
                            enabled: "{oViewModel>/allowEdit}",
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                        });
                        // .addEventDelegate({
                        //     oninput: function (oEvent) {
                        //         // if (oNewRowModel) {
                        //         //     oNewRowModel.firePropertyChange();
                        //         // }
                        //     }.bind(this)
                        // });
                    } else {
                        oCell = new sap.m.Text({
                            text: "",
                            layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                        });
                    }
                    oRow.addItem(oCell);
                } else if (col.col_type == "V") {
                    let sFound = aVals.includes(col.col_name);

                    if (oContext.getProperty("ref_mpoint") != "") {
                        if (!skipMpoint) {
                            for (let index = 0; index < aVals.length; index++) {
                                const el = aVals[index];
                                if (el == "mpoint") {
                                    oCell = new sap.m.Input({
                                        value: "{oNewRowModel>values/" + el + "/sval}", type: "Number", required: true,
                                        placeholder: "Measure", enabled: { path: "oViewModel>/allowEdit" }
                                    });
                                    // .addEventDelegate({
                                    //     oninput: function (oEvent) {
                                    //         // if (oNewRowModel) {
                                    //         //     oNewRowModel.firePropertyChange();
                                    //         // }
                                    //     }.bind(this)
                                    // });
                                } else if (el == "lower_limit" && oContext.getProperty("lower_limit").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("lower_limit"));
                                    oCell = new sap.m.Text({
                                        // text: "Min: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Min: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                    });
                                } else if (el == "upper_limit" && oContext.getProperty("upper_limit").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("upper_limit"));
                                    oCell = new sap.m.Text({
                                        // text: "Max: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Max: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                    });
                                } else if (el == "recdv" && oContext.getProperty("recdv").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("recdv"));
                                    oCell = new sap.m.Text({
                                        // text: "Last: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Last: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                    });
                                } else {
                                    oCell = new sap.m.Text({
                                        text: "{oNewRowModel>values/" + el + "/sval}", textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ alignSelf: "Center" })]
                                    });
                                }

                                oCell.setLayoutData(new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth }));
                                oValueBox.addItem(oCell);
                                skipMpoint = true;
                            }
                        }
                    } else {
                        if (oContext.getProperty("steus") == "INT1") {
                            if (this.getView().getModel("oViewModel").getProperty("/allowEdit")) {
                                oCell = new sap.m.ComboBox({
                                    width: colBasis,
                                    enabled: "{oViewModel>/allowEdit}",
                                    // selectedKey: "{/values/" + cellKey + "/sval}",
                                    selectionChange: this._onGroupCategorySelect.bind(this),
                                    layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })],
                                    customData: [
                                        new sap.ui.core.CustomData({ key: "category", value: oContext.getProperty("category") }),
                                        new sap.ui.core.CustomData({ key: "colname", value: cellKey })
                                    ],
                                    change: this.onComboBoxChange
                                });
                                let oItemTemplate = new sap.ui.core.Item({
                                    key: "{oViewModel>key}",
                                    text: "{oViewModel>text}"
                                })
                                oCell.bindAggregation("items", {
                                    path: "oViewModel>/list",
                                    template: oItemTemplate
                                });
                                oCell.addStyleClass("group-header");
                            } else {
                                oCell = new sap.m.Text({
                                    text: "",
                                    layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                                });
                            }
                        } else if (sFound) {
                            oCell = new sap.m.ComboBox({
                                width: colBasis,
                                enabled: "{oViewModel>/allowEdit}",
                                selectedKey: "{oNewRowModel>values/" + cellKey + "/sval}",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow })],
                                change: this.onComboBoxChange
                            });
                            let oItemTemplate = new sap.ui.core.Item({
                                key: "{oViewModel>key}",
                                text: "{oViewModel>text}"
                            })
                            oCell.bindAggregation("items", {
                                path: "oViewModel>/list",
                                template: oItemTemplate
                            });
                        } else {
                            oCell = new sap.m.Text({
                                text: "",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, minWidth: this._sMinWidth })]
                            });
                        }
                        oValueBox.addItem(oCell);
                    }
                    let sValueBoxMinWidth = "";
                    if (aVals.length > this._nValueColumnCount) {
                        let nValueBoxMinWidth = aVals.length * parseFloat(this._sMinWidth);
                        sValueBoxMinWidth = nValueBoxMinWidth.toString() + "rem";
                    } else {
                        sValueBoxMinWidth = this._sValueBoxMinWidth;
                    }
                    oValueBox.getLayoutData().setMinWidth(sValueBoxMinWidth);
                    oRow.addItem(oValueBox);
                }
            }

            return oRow;
        },

        _buildRowRO: function (sId, oContext) {
            const oRow = new sap.m.HBox(sId, {
                alignContent: "Start",
                justifyContent: "Start",
                items: []
            });
            const oValueBox = new sap.m.HBox({
                layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 0, shrinkFactor: 0 })]
            });

            let oCell = {};
            let skipMpoint = false;
            for (let col of this._aColumns) {
                let flexGrow = parseFloat(col.col_grow === "" ? 0 : col.col_grow);
                let flexShrink = parseFloat(col.col_shrink === "" ? 0 : col.col_shrink);
                let colBasis = col.col_basis || "auto";
                let cellKey = col.col_name;

                if (col.col_type == "L") {
                    oCell = new sap.m.Text({
                        text: "{oNewRowModel>" + col.col_name + "}",
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                    });

                    if (oContext.getProperty("steus") == "INT1") {
                        oRow.addStyleClass("group-header");
                    } else {
                        oRow.addStyleClass("label-col");
                    }
                    oRow.addItem(oCell);
                    
                } else if (col.col_type == 'A') {
                    oCell = new sap.m.Text({
                        text: "{oNewRowModel>values/" + cellKey + "/sval}",
                        layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                    });
                    oRow.addStyleClass("attr-col");
                    oRow.addItem(oCell);

                } else if (col.col_type == "V") {
                    let aVals = oContext.getProperty("column_list") ? oContext.getProperty("column_list").split(",").map(function (item) { return item.trim() }) : [];
                    let sFound = aVals.includes(col.col_name);

                    if (oContext.getProperty("ref_mpoint") != "") {
                        if (!skipMpoint) {
                            for (let index = 0; index < aVals.length; index++) {
                                const el = aVals[index];
                                if (el == "mpoint") {
                                    oCell = new sap.m.Text({
                                        text: "{oNewRowModel>values/" + el + "/sval}", textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth, styleClass: "text-right" })]
                                    });
                                } else if (el == "lower_limit" && oContext.getProperty("lower_limit").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("lower_limit"));
                                    oCell = new sap.m.Text({
                                        // text: "Min: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Min: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth })]
                                    });
                                } else if (el == "upper_limit" && oContext.getProperty("upper_limit").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("upper_limit"));
                                    oCell = new sap.m.Text({
                                        // text: "Max: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Max: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth })]
                                    });
                                } else if (el == "recdv" && oContext.getProperty("recdv").length > 0) {
                                    let sFormatted = formatter.formatNumber(oContext.getProperty("recdv"));
                                    oCell = new sap.m.Text({
                                        // text: "Last: {oNewRowModel>values/" + el + "/sval}" + oContext.getProperty("atawe"), textAlign: "Center",
                                        text: "Last: " + sFormatted + oContext.getProperty("atawe"), textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth })]
                                    });
                                } else {
                                    oCell = new sap.m.Text({
                                        text: "{oNewRowModel>values/" + el + "/sval}", textAlign: "Center",
                                        layoutData: [new sap.m.FlexItemData({ baseSize: "25%", growFactor: 1, minWidth: this._sMinWidth })]
                                    });
                                }

                                oValueBox.addItem(oCell);
                                skipMpoint = true;
                            }
                        }
                    } else {
                        if (oContext.getProperty("steus") == "INT1") {
                            oCell = new sap.m.Text({
                                text: "{/values/" + cellKey + "/sval}",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, shrinkFactor: flexShrink })]
                            });
                            // }
                        } else if (sFound) {
                            oCell = new sap.m.Text({
                                text: "{oNewRowModel>values/" + cellKey + "/sval}",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, minWidth: this._sMinWidth, styleClass: "text-center" })]
                            });
                        } else {
                            oCell = new sap.m.Text({
                                text: "",
                                layoutData: [new sap.m.FlexItemData({ baseSize: colBasis, growFactor: flexGrow, minWidth: this._sMinWidth })]
                            });
                        }
                        oValueBox.addItem(oCell);
                    }
                    let sValueBoxMinWidth = "";
                    if (aVals.length > this._nValueColumnCount) {
                        let nValueBoxMinWidth = aVals.length * parseFloat(this._sMinWidth);
                        sValueBoxMinWidth = nValueBoxMinWidth.toString() + "rem";
                    } else {
                        sValueBoxMinWidth = this._sValueBoxMinWidth;
                    }
                    oValueBox.getLayoutData().setMinWidth(sValueBoxMinWidth);
                    oRow.addItem(oValueBox);
                }
            }

            return oRow;
        },

        onExit: function () {
            // this._aRowModels = [];
            this._oChecklistHeader = {};
        },

        handleUpload: function () {
            sap.m.MessageToast("File uploaded successfully.");
        },

        onFileSizeExceed: function (oEvent) {
            sap.m.MessageBox.error("Maximum filesize exceeded");
        },

        onFileChange: async function (oEvent) {
            this._bAttachmentChanged = true;
            const oFile = oEvent.getParameters("files").files[0];
            const sId = oEvent.getSource().getId();
            const oModel = this.getView().getModel("oChecklistModel");
            // const aAttachments = oModel.getProperty("/to_Attachment/results");
            if (oFile) {
                const comprFile = await imageCompression(oFile, {
                    maxSizeMB: 0.2,
                    maxWidthOrHeight: 360
                })
                const reader = new FileReader();
                reader.onload = function (e) {
                    const sBase64 = e.target.result;
                    if (sId.includes("fileUploader1")) {
                        oModel.setProperty("/to_Attachment/results/0/att_url", sBase64);
                    } else if (sId.includes("fileUploader2")) {
                        oModel.setProperty("/to_Attachment/results/1/att_url", sBase64);
                    }
                };
                reader.readAsDataURL(comprFile);
            }
        },

        onApproverChange: function (oEvent) {
            this._bApproverChanged = true;
            const oSelectedItem = oEvent.getParameter("selectedItem");
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aApprovers = oChecklistModel.getProperty("/to_Approver/results");
            const sComboBoxId = oEvent.getSource().getId();

            let iIndex = 0;
            if (sComboBoxId.endsWith("approver1-cmb")) {
                iIndex = 0;
            } else if (sComboBoxId.endsWith("approver2-cmb")) {
                iIndex = 1;
            } else if (sComboBoxId.endsWith("approver3-cmb")) {
                iIndex = 2;
            }

            if (oSelectedItem == null) {
                aApprovers[iIndex].bp_id = "";
                aApprovers[iIndex].bp_name = "";
                aApprovers[iIndex].bp_func = "";
                // aApprovers[iIndex].bp_position = "";
                oChecklistModel.setProperty("/to_Approver/results", aApprovers);
                return;
            }

            const oPartnerVHModel = this.getView().getModel("partnerVH");
            oPartnerVHModel.read("/ZC_PM0001_Partners_VH", {
                filters: [new sap.ui.model.Filter("bp_id", sap.ui.model.FilterOperator.EQ, oSelectedItem.getKey())],
                success: function (oData) {
                    const oSelectedPartner = oData.results.find(partner => partner.bp_id === oSelectedItem.getKey());

                    aApprovers[iIndex].bp_id = oSelectedPartner.bp_id;
                    aApprovers[iIndex].bp_name = oSelectedPartner.bp_name;
                    aApprovers[iIndex].bp_func = oSelectedPartner.bp_func;
                    // aApprovers[iIndex].bp_position = oSelectedPartner.bp_position;
                    oChecklistModel.setProperty("/to_Approver/results", aApprovers);
                },
                error: function (oError) {
                    console.error("Error fetching partner details: ", oError);
                }
            });
        },

        onLeaderChange: function (oEvent) {
            const sValue = oEvent.getParameter("newValue");
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            let aExist = aLeaders.filter(function (el) {
                return el.bp_name.length > 0 && el.bp_name == sValue;
            });
            if (aExist.length > 0) {
                const oControl = oEvent.getSource();
                sap.m.MessageBox.error("Nama Leader sudah dipakai");
                oControl.setSelectedItem(null);
                this._oLeaderDuplicate = true;
            }
            this.onComboBoxChange(oEvent);
        },

        onLeaderSelectionChange: function (oEvent) {
            this._bLeaderChanged = true;
            const oSelectedItem = oEvent.getParameter("selectedItem");
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");

            if (oSelectedItem == null) {
                // const oSource = oEvent.getSource();
                return;
            }

            const sSelectedKey = oSelectedItem.getKey();
            const oPartnerVHModel = this.getView().getModel("partnerVH");
            // const aPartners = oPartnerVHModel.getProperty("/ZC_PM0001_Partners_VH");
            oPartnerVHModel.read("/ZC_PM0001_Partners_VH", {
                filters: [new sap.ui.model.Filter("bp_id", sap.ui.model.FilterOperator.EQ, sSelectedKey)],
                success: function (oData) {
                    const oSelectedPartner = oData.results.find(partner => partner.bp_id === sSelectedKey);
                    // Update the selected leader's details
                    for (let i = 0; i < aLeaders.length; i++) {
                        if (aLeaders[i].bp_id === sSelectedKey) {
                            aLeaders[i].bp_id = oSelectedPartner.bp_id;
                            aLeaders[i].bp_name = oSelectedPartner.bp_name;
                            aLeaders[i].bp_func = oSelectedPartner.bp_func;
                            // aLeaders[i].bp_position = oSelectedPartner.bp_position;
                            break;
                        }
                    }
                    oChecklistModel.setProperty("/to_Partner/results", aLeaders);
                },
                error: function (oError) {
                    console.error("Error fetching partner details: ", oError);
                }
            });
        },

        onAddLeaderPress: function (oEvent) {
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const aLeaders = oChecklistModel.getProperty("/to_Partner/results");
            let sFound = "";
            for (let i = 0; i < aLeaders.length; i++) {
                let oLead = aLeaders[i]
                if (oLead.loekz == "X") {
                    aLeaders[i].loekz = "";
                    aLeaders[i].bp_id = "";
                    aLeaders[i].bp_name = "";
                    oChecklistModel.setProperty("/to_Partner/results", aLeaders);
                    sFound = "X";
                    break;
                }
            }
            if (sFound != "X") {
                sap.m.MessageToast.show("Jumlah inspector sudah maksimum.");
                return;
            }
            const oTblLeader = this.getView().byId("table-leaders");
            // const oTblLeader = sap.ui.getCore().byId("table-leaders");
            const oBind = oTblLeader.getBinding("rows");
            if (oBind) {
                oBind.refresh(true);
            }
        },

        onDelLeaderPress: function (oEvent) {
            const oParent = oEvent.getSource().getParent();
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const oContext = oParent.getBindingContext("oChecklistModel");
            const sPath = oContext.getPath();
            if (sPath) {
                let oObject = oChecklistModel.getProperty(sPath);
                oObject.bp_id = "";
                oObject.bp_name = "";
                oObject.loekz = "X";
                oChecklistModel.setProperty(sPath, oObject)
                const oTblLeader = this.getView().byId("table-leaders");
                const oBind = oTblLeader.getBinding("rows");
                if (oBind) {
                    oBind.refresh(true);
                }
            }
        },

        _onGroupCategorySelect: function (oEvent) {
            let oSelectedKey = oEvent.getParameter("selectedItem").getKey();
            let oCmbBox = oEvent.getSource();
            let sCategory = oCmbBox.data("category");
            let sColname = oCmbBox.data("colname");

            const oNewRowModel = this.getView().getModel("oNewRowModel");
            const aItems = oNewRowModel.getProperty("/");

            if (aItems.length > 0) {
                aItems.forEach(function (el) {
                    if (el.category == sCategory && el.steus != "INT1" && sColname in el.values) {
                        el.values[sColname].sval = oSelectedKey;
                    }
                })
            }
            oNewRowModel.setProperty("/", aItems);
        },

        _validateOnSave: function (oChecklistModel) {
            if (this._containsError) {
                // sap.m.MessageBox.error("Masih ada input yang error, silakan cek input yang berwarna merah");
                // return "E";
            }
            let sGstri = oChecklistModel.getProperty("/gstri");
            let sGltri = oChecklistModel.getProperty("/gltri");

            if (sGstri == null || sGltri == null) {
                sap.m.MessageBox.error("Actual Start dan Actual Finish tidak boleh kosong");
                return "E";
            }

            if (validator.dateIsFuture(sGstri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh di masa datang");
                return "E";
            }
            if (validator.dateIsFuture(sGltri)) {
                sap.m.MessageBox.error("Actual Finish tidak boleh di masa datang");
                return "E";
            }
            if (validator.startDateIsLater(sGstri, sGltri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh setelah Actual Finish");
                return "E";
            }

            let firstApprover = oChecklistModel.getProperty("/to_Approver/results/0/bp_name");
            if (!firstApprover.length > 0) {
                sap.m.MessageBox.error("Harus ada Checked By");
                return "E";
            }

            let defPartner = oChecklistModel.getProperty("/to_Partner/results").filter(function (el) {
                return el.loekz == "";
            });

            if (defPartner.length == 0) {
                sap.m.MessageBox.error("Setidaknya harus ada 1 Leader");
                return "E";
            } else {
                for (let el of defPartner) {
                    if (el.bp_id == "0000000000" || el.bp_name == "") {
                        sap.m.MessageBox.error("Nama Leader tidak boleh kosong");
                        return "E";
                    }
                }
            }

            return "S";
        },

        onActualDateChange: function (oEvent) {
            let oSource = oEvent.getSource();
            let sDateString = oSource.getValue();

            if (validator.dateIsFuture(sDateString)) {
                sap.m.MessageBox.error("Tanggal Actual tidak boleh di masa datang");
            }
        },

        onComboBoxChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            // var sValue = oEvent.getParameter("value"); // Get the value typed by the user

            if (!sSelectedKey) {
                oComboBox.setValueState(sap.ui.core.ValueState.Error);
                // oComboBox.setValueStateText("Invalid entry. Please select an item from the list.");
                sap.m.MessageBox.error("Input tidak ada dalam list");
                this._containsError = true;
            } else {
                oComboBox.setValueState(sap.ui.core.ValueState.None);
                // oComboBox.setValueStateText("");
            }
        }
    });
});