BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(255) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Note] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(255) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Note_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UserNoteConfiguration] (
    [userId] INT NOT NULL,
    [noteId] INT NOT NULL,
    [folderId] INT,
    CONSTRAINT [UserNoteConfiguration_pkey] PRIMARY KEY CLUSTERED ([userId],[noteId])
);

-- CreateTable
CREATE TABLE [dbo].[Folder] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(100) NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [Folder_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Folder_name_userId_key] UNIQUE NONCLUSTERED ([name],[userId])
);

-- AddForeignKey
ALTER TABLE [dbo].[UserNoteConfiguration] ADD CONSTRAINT [UserNoteConfiguration_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserNoteConfiguration] ADD CONSTRAINT [UserNoteConfiguration_noteId_fkey] FOREIGN KEY ([noteId]) REFERENCES [dbo].[Note]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserNoteConfiguration] ADD CONSTRAINT [UserNoteConfiguration_folderId_fkey] FOREIGN KEY ([folderId]) REFERENCES [dbo].[Folder]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Folder] ADD CONSTRAINT [Folder_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
