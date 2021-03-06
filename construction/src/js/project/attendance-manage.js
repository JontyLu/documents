define([
    'jquery',
    'common', 
    'dateFormat',
    'layuiAll',
    'css!css/project/attendance-manage'
], function(
    $, 
    HSKJ,
    dateFormat
){
return function() {
    HSKJ.ready(function () {
        var roleid = HSKJ.getUserInfo('roleid');
        console.log('roleid', roleid);
        var attendanceList = {
            init: function () {
                this.renderHtml();
                this.wactch();
            },

            data: {
                checkExport: null
            },

            renderHtml: function() {
                var self = this;
                
                HSKJ.renderTpl('.module-container', 'text!tpl/project/attendance-manage.tpl', { 
                    pname: router.getParameter('pname'),
                    roleid: roleid
                }, function () {
                    self.renderTable();//渲染表格
                    layui.form.render('radio');
                    
                    //获取劳务企业
                    HSKJ.getSystemparameter('enterprise', function(data){
                        console.log('劳务企业', data)
                        var html = '<option>全部</option>';
                        $(data[0].list).each(function(k, v){
                            console.log('v', v)
                            html += '<option value="'+ v.value +'">'+ v.title +'</option>'
                        })
                        $('#enterprise').html(html);
                        layui.form.render('select');
                    })

                    //enterprise
                    layui.laydate.render({ //渲染日期
                        elem: '#dateRange'
                        , type: 'date'
                        , range: '~'
                        , format: 'yyyy-MM-dd'
                        , value: dateFormat.utils.getFistDay() + ' ~ ' + dateFormat.utils.getLastDay()
                        , done: function (value, date) {
                            self.reloadTable();
                        }
                    });
                })
            },

            renderTable: function (status){ 
                var self = this;
                HSKJ.loadingShow();

                if (!router.getParameter('pid')) {
                    layui.layer.msg('缺少参数，请返回项目列表重新点击考勤记录')
                    return;
                }

                var cols = [
                    { field: 'name', title: '姓名' }
                    , { title: '性别', templet: '<div>{{ d.sex == 1? "男" : "女"}}</div>'}
                    , { field: 'idcard', title: '身份证号码', sort: true }
                    , { field: 'enterprise', title: '所在企业' }
                    , { field: 'belongclass', title: '班组' }
                    , { field: 'worktype', title: '工种' }
                    , { field: 'totalsum', title: '总工时', sort: true}
                    , { field: 'normaldays', title: '正常天数', sort: true }
                    , { field: 'errordays', title: '异常天数', sort: true}
                ];

                HSKJ.renderTable({
                    url: ENV.API + 'system/attendance/query',
                    id: 'attendanceListTable',
                    elem: '#tableContent'
                    , where: {
                        currentproject: router.getParameter('pid'),
                        startdate: $('#dateRange').val().split(' ~ ')[0] || dateFormat.utils.getFistDay(),
                        enddate: $('#dateRange').val().split(' ~ ')[1] || dateFormat.utils.getLastDay()
                    }
                    , cols: cols
                    , done: function (res, curr, count) {
                        
                    }
                })
            },

            reloadTable: function(){
                layui.table.reload('attendanceListTable', {
                    where: { 
                        name: $("#keyword").val(),
                        enterprise: $('select[name=enterprise] option:selected').html() == '全部'? '': $('select[name=enterprise] option:selected').html(),
                        startdate: $('#dateRange').val().split(' ~ ')[0] || dateFormat.utils.getFistDay(),
                        enddate: $('#dateRange').val().split(' ~ ')[1] || dateFormat.utils.getLastDay()
                    }
                    , page: {
                        curr: 1
                    }
                });
            },

            //导出数据
            exportDataAjax: function(){
                var self = this;
                HSKJ.loadingShow();
                HSKJ.POST({
                    url: 'system/attendance/export',
                    data: {
                        currentproject: router.getParameter('pid'),
                        startdate: $('#dateRange').val().split(' ~ ')[0] || dateFormat.utils.getFistDay(),
                        enddate: $('#dateRange').val().split(' ~ ')[1] || dateFormat.utils.getLastDay(),
                        name: $("#keyword").val()
                    },
                    success: function (json) {
                        if (json && json.code == 0) {
                            window.location.href = json.data.download;
                            layui.layer.msg('导出成功')
                        } else {
                            layui.layer.msg(json.message)
                        }
                    }
                })
            },

            wactch: function () {
                var self = this; 

                layui.form.on('radio(monthRadio)', function (data) {
                    var str = dateFormat.utils.getFistDay() + ' ~ ' + dateFormat.utils.getLastDay()
                    if (data.value == '上月'){
                        str = dateFormat.utils.getFistDay(-1) + ' ~ ' + dateFormat.utils.getLastDay(-1)
                    }
                    console.log('日期', str)
                    $('#dateRange').val(str)
                });  

                $(document)
                .off('click', '#doExport')
                .on('click', '#doExport', function () {//导出
                    self.exportDataAjax();
                })
                .off('click', '#doSearch')
                .on('click', '#doSearch', function () {
                    self.reloadTable();
                })
            }
        }
        attendanceList.init();
    })
}}
)