"""Add is_generating and is_public to Podcast

Revision ID: e52b74b955ea
Revises: a3459514aba5
Create Date: 2025-07-01 14:40:53.170719

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = 'e52b74b955ea'
down_revision: Union[str, None] = 'a3459514aba5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('podcast', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_generating', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('is_public', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('podcast', schema=None) as batch_op:
        batch_op.drop_column('is_public')
        batch_op.drop_column('is_generating')

    # ### end Alembic commands ###
