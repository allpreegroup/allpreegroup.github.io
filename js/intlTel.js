$(document).ready(function () {
    
            // Set up phone widget
            $("#phone").intlTelInput({
                utilsScript: 'https://www.allpree.com/js/utils.js',
                numberType: "MOBILE",
                nationalMode: false,
                autoFormat: true,
                autoPlaceholder: true
            });
    
            // Click on button send
            $('#addContact').submit(function (event) {
                event.preventDefault();
                var formData = $("#addContact").serializeArray();
                $('#submitButton').prop('disabled', true);
                $('.form-error').hide();
    
                // Convert the form data to backend format
                var requestData = {};
                formData.map(function (element) {
                    requestData[element.name] = element.value;
                });
    
                // Send post to API
		$.ajax({
                url: 'https://hooks.zapier.com/hooks/catch/113581/o61bzz5/',
                type: "GET",
                beforeSend: function (request) {
                    // request.setRequestHeader("Access-Control-Allow-Origin", "*");
                },
                // dataType: 'json',
                // contentType: 'application/json',
                data: requestData,
                success: function (result) {
                    // You can see the result from the console
                    // tab of the developer tools
                    // console.log(result);
                    $('.custom-form').hide();
                    $('.form-success').show();
                },
                error: function (xhr, resp, text) {
                    $('.form-error').show();
                    $('#submitButton').prop('disabled', false);
                }
	        });
            });
        });
