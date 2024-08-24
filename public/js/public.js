/* public.js */

/*Used for make the message can fade out */
$(document).ready(function() {
    // Wait for the DOM to be fully loaded before executing the script
    setTimeout(function() {
        $(".alert").fadeOut("fast", function() {
            // This callback function is executed after the fadeOut completes
            $(this).remove();  // Removes the alert element from the DOM entirely
        });
    }, 2000);  // 2000 milliseconds = 2 seconds
});
