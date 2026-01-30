
$(document).ready(function () {
  $('.download-btn').on('click', function () {
    const fileId = $(this).data('id');
    console.log('Downloading file ID:', fileId);
  });
});
