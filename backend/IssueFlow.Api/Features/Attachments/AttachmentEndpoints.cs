using IssueFlow.Api.Data;
using IssueFlow.Api.Features.Common;
using IssueFlow.Api.Infrastructure;
using IssueFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IssueFlow.Api.Features.Attachments;

public static class AttachmentEndpoints
{
    public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/issues/{issueId:long}/attachments").WithTags("Attachments");

        group.MapGet("/", GetAttachmentsAsync)
            .WithName("GetAttachments")
            .Produces<IReadOnlyList<AttachmentResponse>>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", UploadAttachmentAsync)
            .WithName("UploadAttachment")
            .RequireAuthorization()
            .DisableAntiforgery()
            .Accepts<IFormFile>("multipart/form-data")
            .Produces<AttachmentResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status415UnsupportedMediaType);

        endpoints.MapGet("/api/attachments/{id:long}", DownloadAttachmentAsync)
            .WithName("DownloadAttachment")
            .WithTags("Attachments")
            .ProducesProblem(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetAttachmentsAsync(
        long issueId,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (!await db.Issues.AnyAsync(issue => issue.Id == issueId, cancellationToken))
        {
            return ApiResults.NotFound("Issue");
        }

        var attachments = await db.Attachments
            .AsNoTracking()
            .Where(attachment => attachment.IssueId == issueId)
            .OrderByDescending(attachment => attachment.CreatedAt)
            .ThenByDescending(attachment => attachment.Id)
            .ToListAsync(cancellationToken);

        return Results.Ok(attachments.Select(ToResponse));
    }

    private static async Task<IResult> UploadAttachmentAsync(
        long issueId,
        HttpRequest request,
        AppDbContext db,
        AttachmentStorage storage,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status415UnsupportedMediaType,
                title: "Unsupported media type",
                detail: "Upload the attachment as multipart/form-data.");
        }

        var issue = await db.Issues.SingleOrDefaultAsync(item => item.Id == issueId, cancellationToken);
        if (issue is null)
        {
            return ApiResults.NotFound("Issue");
        }

        IFormCollection form;
        try
        {
            form = await request.ReadFormAsync(cancellationToken);
        }
        catch (InvalidDataException)
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["file"] = ["The uploaded form is invalid or too large."]
            });
        }

        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0)
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["file"] = ["Choose a file to upload."]
            });
        }

        if (file.Length > AttachmentFilePolicy.MaxFileSize)
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["file"] = ["Files must be 5 MB or smaller."]
            });
        }

        if (!AttachmentFilePolicy.TryGetSafeExtension(file, out var extension) ||
            !await AttachmentFilePolicy.HasValidSignatureAsync(file, cancellationToken))
        {
            return ApiResults.Validation(new Dictionary<string, string[]>
            {
                ["file"] = ["Upload a valid PNG, JPEG, PDF, or text file."]
            });
        }

        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            originalFileName = $"attachment{extension}";
        }
        if (originalFileName.Length > 255)
        {
            originalFileName = originalFileName[..(255 - extension.Length)] + extension;
        }

        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        storage.EnsureCreated();
        var destinationPath = storage.GetPath(storedFileName);

        try
        {
            await using var destination = new FileStream(
                destinationPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);
            await file.CopyToAsync(destination, cancellationToken);

            var attachment = new Attachment
            {
                IssueId = issueId,
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                ContentType = file.ContentType.ToLowerInvariant(),
                Size = file.Length,
                CreatedAt = DateTimeOffset.UtcNow,
                Issue = issue
            };
            db.Attachments.Add(attachment);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/attachments/{attachment.Id}",
                ToResponse(attachment));
        }
        catch (Exception exception)
        {
            if (File.Exists(destinationPath))
            {
                File.Delete(destinationPath);
            }

            loggerFactory.CreateLogger("IssueFlow.Attachments")
                .LogError(exception, "Attachment upload failed for issue {IssueId}", issueId);
            throw;
        }
    }

    private static async Task<IResult> DownloadAttachmentAsync(
        long id,
        HttpResponse response,
        AppDbContext db,
        AttachmentStorage storage,
        CancellationToken cancellationToken)
    {
        var attachment = await db.Attachments
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (attachment is null)
        {
            return ApiResults.NotFound("Attachment");
        }

        var path = storage.GetPath(attachment.StoredFileName);
        if (!File.Exists(path))
        {
            return ApiResults.NotFound("Attachment file");
        }

        response.Headers.XContentTypeOptions = "nosniff";
        return Results.File(
            path,
            attachment.ContentType,
            attachment.OriginalFileName,
            enableRangeProcessing: true);
    }

    private static AttachmentResponse ToResponse(Attachment attachment) =>
        new(
            attachment.Id,
            attachment.IssueId,
            attachment.OriginalFileName,
            attachment.ContentType,
            attachment.Size,
            attachment.CreatedAt,
            $"/api/attachments/{attachment.Id}");
}
