/*!
 * verifyForm v0.0.1
 * Url: https://github.com/pauky/verifyForm
 */

;(function ($, window, document) {
    'use strict';

    $.fn.verifyForm = function (options) {
        var o = null;

        // 初始化全局对象o和表单项数组o.items
        var init = function (options) {
            o = $.extend({}, $.fn.verifyForm.defaults, $.fn.verifyType, options);
            var items = $.extend(true, [], $.fn.verifyForm.defaults.items, options.items);
            var i;
            o.allTips = []; // 所有提示项数组
            for (i = 0; i < items.length; i += 1) {
                items[i].itemSelector = '.' + items[i].itemClass;
                o.allTips[i] = items[i].tipSelector = '.' + items[i].tipClass;
            }
            o.allTips = o.allTips.join(', ');
            o.items = items;
        }

        // 验证数据的方法
        var testItem = function (testCase, $item) {
            var i,
                testCaseLength = testCase.length,
                lackClass = false; // 是否增加lackClass
            for (i = 0; i < testCaseLength; i += 1) {
                if ($item.hasClass(testCase[i].itemClass)) {
                    if (testCase[i].itemClass === o.required) {
                        if ($item.val().replace(testCase[i].pattern, '') === '') {
                            $item.nextAll(testCase[i].tipSelector).css('display', 'inline');
                            lackClass = true;
                        } else {
                            $item.nextAll(testCase[i].tipSelector).css('display', 'none');
                        }
                    } else {
                        if ($item.val()) {
                            if (testCase[i].pattern.test($item.val())) {
                                $item.nextAll(testCase[i].tipSelector).css('display', 'none');
                            } else {
                                $item.nextAll(testCase[i].tipSelector).css('display', 'inline');
                                lackClass = true;
                            }
                        } else {
                            $item.nextAll(testCase[i].tipSelector).css('display', 'none');
                        }
                        if (!lackClass && $item.attr(o.valHref)) {
                            $.ajax({
                                url: $item.attr(o.valHref),
                                timeout: 500,
                                async: false,
                                dataType: 'text',
                                success: function (res) {
                                    res = $.parseJSON(res);
                                    if (res['info'] !== $item.val()) {
                                        $item.nextAll('.'+o.valClass).css('display', 'inline');
                                        lackClass = true;
                                    } else {
                                        $item.nextAll('.'+o.valClass).css('display', 'none');
                                    }
                                },
                                error: function () {
                                    alert('系统异常');
                                }
                            });
                        } else {
                            $item.nextAll('.'+o.valClass).css('display', 'none');
                        }
                    }
                }
            }
            if (lackClass) {
                $item.addClass(o.lackClass);
                return true;
            } else {
                $item.removeClass(o.lackClass);
                return false;
            }
        };

        // 增加提示的方法
        var addTips = function (eleArr) {
            var i,
                j,
                $ele = null,
                eleArrlength = eleArr.length,
                eleLength = 0,
                $that = null;
            for (i = 0; i < eleArrlength; i += 1) {
                $ele = $(eleArr[i].itemSelector);
                eleLength = $ele.length;
                for (j = 0; j < eleLength; j += 1) {
                    $that = $ele.eq(j);
                    $that.after('<span class="'+ eleArr[i].tipClass +'">'+ $that.attr(eleArr[i].tipAttr) +'</span>');
                    if ($that.attr(o.valHref) && $that.nextAll('.'+o.valClass).text() === '') {
                        $that.after('<span class="'+o.valClass+'">'+ $that.attr(o.valTip) +'</span>');
                    }
                }
            }
        };

        // 初始化
        init(options);

        // 初始化提示内容
        addTips(o.items);

        // 隐藏提示内容
        $(o.allTips+', .'+o.valClass).css('display', 'none');

        // 每个验证表单项绑定事件
        (function () {
            var $formItems = null,
                i,
                formItemsLength = 0,
                result = [];
            $(o.verifyForm).each(function () {
                // 分别为每个表单进行处理，便于识别表单是否被填写
                var $that = $(this);
                $formItems = $that.find('input[type="text"], textarea'); // 取出所有表单项
                formItemsLength = $formItems.length;
                for (i = 0; i < formItemsLength; i += 1) {
                    // 为每个表单项增加失去焦点的事件
                    $formItems.eq(i).blur(function () {
                        var $self = $(this);
                        console.log($that);
                        if (testItem(o.items, $self)) {
                            $.data($that[0], 'noSub', true);
                        }
                        $.data($that[0], 'revise', true); // 标记填写过表单
                    });
                }
            });
        })();
        
        // 提交表单前的验证
        $(o.verifyForm).submit(function () {
            var $that = $(this),
                $formItems = null,
                i,
                formItemsLength = 0,
                noSub = false;

            // 判断是否没有填写表单就直接点击提交
            if (!$.data($that, 'revise')) {
                $formItems = $that.find('input[type="text"], textarea'); // 取出所有表单项
                formItemsLength = $formItems.length;
                for (i = 0; i < formItemsLength; i += 1) {
                    if (testItem(o.items, $formItems.eq(i))) {
                        $.data($that, 'noSub', true);
                        return false; // 只要有一项不符合要求，则退回
                    }
                }
            }
            
            // 检查不通过时，不提交
            if ($.data($that, 'noSub')) {
                noSub = true;
            }
            if (noSub) {
                // 初始化并撤消表单提交
                $that.removeData('noSub');
                $that.removeData('revise');
                return false;
            }
        });

    };

    // 默认参数
    $.fn.verifyForm.defaults = {
        verifyForm: '#verifyForm',
        required: 'required',           // 必填项class
        valHref: 'data-href',           // 获取数据属性
        valTip: 'data-valTip',          // 数据不正确时的提示属性
        valClass: 'valClass',           // 数据错误的提示class
        items: [                        // 数据验证的类型
            {itemClass: 'required', tipClass: 'requiredTip', tipAttr: 'data-requiredTip', pattern: /\s/g},
            {itemClass: 'email', tipClass: 'emailTip', tipAttr: 'data-errorTip', pattern: /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/},
            {itemClass: 'tel', tipClass: 'telTip', tipAttr: 'data-errorTip', pattern: /^0(([1-9]\d)|([3-9]\d{2}))\d{8}$/},
            {itemClass: 'celephone', tipClass: 'celephoneTip', tipAttr: 'data-errorTip', pattern: /^13[0-9]{9}$|15[0-9]{9}$|18[0-9]{9}$/}
        ],
        lackClass: 'lackInput'          // 提示的样式
    };

    $.verifyForm = $.fn.verifyForm;
})(jQuery, window, document);